# Production architecture (operational site + cloud)

This document describes the **anticipated** deployment for a real shop operating with local-first sync and an owner-visible cloud projection. It complements [OFFICE-HOURS-DESIGN-20260327.md](OFFICE-HOURS-DESIGN-20260327.md), [PHASE1.md](PHASE1.md), and [SYNC-ORDERING-LADDER.md](SYNC-ORDERING-LADDER.md).

**How to view PlantUML:** use a PlantUML plugin (VS Code, IntelliJ), [plantuml.com](https://www.plantuml.com/plantuml), or render the bundled [diagrams/production-architecture.puml](diagrams/production-architecture.puml) locally.

---

## 1. Target topology (containers)

High-level view: **operators use a browser client** at the site. A **site boundary** (Compose stack or k8s namespace) holds durable local state and a **sync worker**. **Cloud** hosts ingress, durable events, projection, and owner-facing APIs.

### 1.1 Deployment diagram

```plantuml
@startuml production-topology
skinparam linetype ortho
skinparam packageStyle rectangle
skinparam shadowing false
title Production topology: site boundary vs cloud

package "Site (shop LAN / edge)" as SITE {
  component "shop-ui\n(static + PWA)" as UI
  component "site-api\n(optional)\nlocal commands" as SAPI
  component "sync-worker\n(outbox flush)" as SW
  database "local-db\n(event log, outbox,\n fleet cache)" as LDB
  UI -down-> SAPI : HTTPS\n(same origin or LAN)
  SAPI -down-> LDB : read/write\nlocal state
  SW -up-> LDB : poll / lease\noutbox
}

package "Cloud" as CLOUD {
  component "sync-ingress\n(API gateway + validate)" as ING
  database "event-store\n(append + idempotency)" as EVT
  component "projector\n(stream consumer)" as PRJ
  database "read-model store\n(owner views)" as RM
  component "owner-api\n(readiness, sites)" as OAPI
  component "owner-ui\n(static)" as OUI
  ING -right-> EVT : accepted\nevents
  PRJ -left-> EVT : ordered\nreplay
  PRJ -down-> RM : upsert\nprojections
  OAPI -up-> RM : queries
  OUI -right-> OAPI : HTTPS
}

SW -down-> ING : POST /sync/events\n(batched, TLS,\n site credential)
LDB .. UI : offline-capable\n(read/write\nqueued if cloud down)

note right of SW
  Worker retries with
  backoff; never drops
  accepted local events.
end note

note bottom of PRJ
  Deterministic ordering:
  see SYNC-ORDERING-LADDER.md
end note

@enduml
```

### 1.2 Logical components (C4-style, containers only)

```plantuml
@startuml production-containers
skinparam componentStyle rectangle
title Containers and trust boundaries

actor "Shop technician\n(browser)" as TECH
actor "Fleet owner\n(browser)" as OWN

package "Site trust boundary" {
  [Shop client (PWA)] as C
  [Site API (optional)] as SA
  [Sync worker] as W
  database "Local durable store" as LS
}

package "Cloud trust boundary" {
  [Sync ingress] as SI
  [Projector] as P
  [Owner API] as OA
  database "Event log" as EL
  database "Read models" as RM
}

TECH --> C
C --> SA
C --> LS : local-first
SA --> LS
W --> LS
W --> SI : site-scoped secret

OWN --> OA
SI --> EL
P --> EL
P --> RM
OA --> RM

@enduml
```

---

## 2. Container and API inventory (production)

Statuses:

| Status | Meaning |
|--------|---------|
| **In repo (demo)** | Exists today in this repository in some form (may be in-browser or demo server only). |
| **Spec’d** | Contract or behavior documented; implementation not production-hardened. |
| **Planned** | Required for production; design agreed, not built here yet. |
| **Later** | Phase 2+ or optional hardening (transfer pipeline, advanced auth, multi-region). |

### 2.1 Site (operational) containers

| Container / runtime | Responsibility | Status |
|---------------------|----------------|--------|
| **shop-ui** | Static assets + PWA shell; talks to local API or IndexedDB adapter. | In repo (demo): SvelteKit static app. |
| **site-api** (optional) | Normalize VIN scan, local RBAC, serve cached fleet JSON to LAN clients. | Planned |
| **sync-worker** | Drain outbox, backoff, TLS to cloud, structured error handling. | In repo (demo): in-browser timer + optional `demo-sync-server` client path. |
| **local-db** | Durable append-only site log, outbox table(s), optional materialized fleet view. | In repo (demo): `localStorage`; production Planned (SQLite/Postgres volume). |

### 2.2 Cloud containers

| Container / runtime | Responsibility | Status |
|---------------------|----------------|--------|
| **sync-ingress** | Authenticate site, validate envelope, rate limit, return reject codes. | In repo (demo): `scripts/demo-sync-server.ts` (minimal). |
| **event-store** | Persist accepted events; enforce idempotency key uniqueness. | Spec’d (TS types + in-memory/file demo); durable store Planned. |
| **projector** | Consume event stream (or batch), apply ordering ladder, update read models. | In repo (demo): same process as accept in demo; separate consumer Planned. |
| **read-model store** | Owner queries: per-site and global readiness, projection lag metadata. | In repo (demo): JSON blob in demo server file; DB Planned. |
| **owner-api** | REST/GraphQL for owner UI; read-only, cache-friendly. | Partially spec’d (`GET /api/sync/state` shape); production Planned. |
| **owner-ui** | Static multi-site dashboard (may be separate build from shop-ui). | Planned (today shop and owner are not split deployables). |

### 2.3 APIs (minimum set)

| API | Direction | Purpose | Status |
|-----|-----------|---------|--------|
| `POST /api/sync/events` | Site → cloud | Batch append with `X-Site-Key` / `X-Site-Id`; idempotent accept. | In repo (demo): demo server. |
| `GET /api/sync/state` (or site-specific read) | Site → cloud | Fetch accepted event set or snapshot for local reconciliation / owner parity checks. | In repo (demo): demo server. |
| `GET /api/owner/...` | Owner UI → cloud | Readiness by site, blocked counts, health (lag, last converged). | Planned |
| (internal) **projector consume** | Projector → event-store | Cursor-based replay, DLQ for poison pills. | Planned |
| **Site local** `POST /local/...` (optional) | Shop UI → site-api | When not fully offline-first in browser; LAN-only operations. | Planned |

TLS, rotation of site credentials, and observability (structured logs, metrics) are **Planned** for every internet-facing hop.

---

## 3. Sequence diagrams

### 3.1 Happy path: maintenance event reaches cloud and read model

```plantuml
@startuml seq-happy-path
autonumber
actor "Technician" as T
participant "Shop UI" as UI
participant "Local store" as L
participant "Sync worker" as W
participant "Sync ingress" as S
participant "Event store" as E
participant "Projector" as P
participant "Read model" as R

T -> UI : Save maintenance (blocking change)
UI -> L : append local event + enqueue outbox
UI -> T : show local readiness (project local stream)

loop flush interval / online
  W -> L : claim outbox batch
  W -> S : POST /api/sync/events\n(batch + site auth)
  S -> E : persist if idempotent
  S -> W : 200 + accepted cursor / cloud snapshot
  W -> L : mark delivered / trim outbox
end

E --> P : new events (stream or poll)
P -> R : upsert vehicle/site readiness
note over T, R: Owner queries read model after projector lags clear
@enduml
```

### 3.2 Simulated outage and reconnect

```plantuml
@startuml seq-outage
autonumber
actor "Technician" as T
participant "Shop UI" as UI
participant "Local store" as L
participant "Sync worker" as W
participant "Cloud ingress" as S

T -> UI : Cloud appears down\n(router or toggle)
UI -> L : continue appends;\noutbox grows

loop while offline
  W -> S : POST fails (timeout)
  W -> W : backoff; retain outbox
end

T -> UI : Connectivity restored
W -> S : retry POST with same\nidempotency keys
S -> W : accept duplicates as no-ops;\naccept new events
W -> L : drain until empty or error
@enduml
```

### 3.3 Owner reads readiness (cloud)

```plantuml
@startuml seq-owner-read
actor "Owner" as O
participant "Owner UI" as OU
participant "Owner API" as API
participant "Read model" as R

O -> OU : Open fleet overview
OU -> API : GET /api/owner/readiness?scopes=sites
API -> R : query materialized\nready / at-risk / blocked
R -> API : rows + metadata\n(lag, last_converged_at)
API -> OU : JSON
OU -> O : render worst-problem-first\nsummary
@enduml
```

---

## 4. Mapping to this repository

| Production piece | Where to look today |
|------------------|---------------------|
| Event envelope, validation, ordering | `src/lib/sync/` |
| Site key demo | `src/lib/sync/siteAuth.ts`, `constants.ts` |
| Demo cloud container (single process) | `scripts/demo-sync-server.ts`, `npm run demo:sync-server` |
| Shop UI (not split from owner yet) | `src/routes/`, `/sync` |

Splitting **shop-ui** and **owner-ui**, adding a real **event-store** and **projector** service, and replacing **localStorage** with on-prem DB volumes are the main gaps before this diagram matches a live production system.

</think>


<｜tool▁calls▁begin｜><｜tool▁call▁begin｜>
StrReplace