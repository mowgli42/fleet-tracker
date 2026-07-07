/**
 * Phase 1 demo cloud: POST /api/sync/events, GET /api/sync/state.
 * Run from repo root: npm run demo:sync-server
 * Point the static app at it: VITE_SYNC_API_URL=http://127.0.0.1:8787 npm run dev
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  acceptEventOnCloud,
  cloudStateToPlain,
  parseCloudStatePayload,
  type CloudState
} from '../src/lib/sync/cloudSimulator.ts';
import type { EventEnvelope } from '../src/lib/sync/eventTypes.ts';
import { validateSiteKey } from '../src/lib/sync/siteAuth.ts';
import { validateEventEnvelope } from '../src/lib/sync/validateEvent.ts';

const PORT = Number(process.env.PORT || 8787);
const statePath = join(process.cwd(), '.demo-cloud', 'state.json');

function cors(res: ServerResponse): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Site-Key, X-Site-Id');
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c) => chunks.push(c as Buffer));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function readState(): CloudState {
  if (!existsSync(statePath)) return { events: [], appliedIdempotencyKeys: new Set() };
  try {
    const raw = readFileSync(statePath, 'utf8');
    return parseCloudStatePayload(JSON.parse(raw) as unknown);
  } catch {
    return { events: [], appliedIdempotencyKeys: new Set() };
  }
}

function writeState(state: CloudState): void {
  mkdirSync(join(process.cwd(), '.demo-cloud'), { recursive: true });
  writeFileSync(statePath, JSON.stringify(cloudStateToPlain(state)));
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  cors(res);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.writeHead(status);
  res.end(JSON.stringify(body));
}

function siteKey(req: IncomingMessage): string | null {
  const h = req.headers['x-site-key'];
  if (typeof h === 'string' && h.trim()) return h.trim();
  if (Array.isArray(h) && h[0]) return h[0].trim();
  return null;
}

function siteIdHeader(req: IncomingMessage): string | null {
  const h = req.headers['x-site-id'];
  if (typeof h === 'string' && h.trim()) return h.trim();
  if (Array.isArray(h) && h[0]) return h[0].trim();
  return null;
}

const server = createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    cors(res);
    res.writeHead(204);
    res.end();
    return;
  }

  const url = req.url?.split('?')[0] ?? '';

  if (req.method === 'GET' && url === '/api/sync/state') {
    const key = siteKey(req);
    const sid = siteIdHeader(req);
    if (!key) {
      sendJson(res, 401, { error: { code: 'missing_site_key', message: 'X-Site-Key required' } });
      return;
    }
    if (!sid) {
      sendJson(res, 401, { error: { code: 'missing_site_id', message: 'X-Site-Id required' } });
      return;
    }
    if (!validateSiteKey(sid, key)) {
      sendJson(res, 403, { error: { code: 'unauthorized_site', message: 'site_id and site key do not match' } });
      return;
    }
    const state = readState();
    sendJson(res, 200, cloudStateToPlain(state));
    return;
  }

  if (req.method === 'POST' && url === '/api/sync/events') {
    const key = siteKey(req);
    if (!key) {
      sendJson(res, 401, { error: { code: 'missing_site_key', message: 'X-Site-Key required' } });
      return;
    }
    let raw: unknown;
    try {
      raw = JSON.parse(await readBody(req)) as unknown;
    } catch {
      sendJson(res, 400, { error: { code: 'invalid_json', message: 'body must be JSON' } });
      return;
    }
    if (!raw || typeof raw !== 'object' || !Array.isArray((raw as { events: unknown }).events)) {
      sendJson(res, 400, { error: { code: 'invalid_body', message: 'expected { events: EventEnvelope[] }' } });
      return;
    }
    const events = (raw as { events: unknown[] }).events as EventEnvelope[];
    let state = readState();

    for (const ev of events) {
      if (!validateEventEnvelope(ev).ok) {
        sendJson(res, 400, {
          error: { code: 'invalid_envelope', message: 'one or more events failed validation' }
        });
        return;
      }
      if (!validateSiteKey(ev.site_id, key)) {
        sendJson(res, 403, {
          error: { code: 'unauthorized_site', message: 'event site_id does not match X-Site-Key' }
        });
        return;
      }
      const hdrSid = siteIdHeader(req);
      if (hdrSid && hdrSid !== ev.site_id) {
        sendJson(res, 400, {
          error: { code: 'site_mismatch', message: 'X-Site-Id must match each event.site_id' }
        });
        return;
      }

      const r = acceptEventOnCloud(state, ev, new Date().toISOString(), { siteKey: key });
      if (r.result.status === 'rejected') {
        sendJson(res, 400, {
          error: { code: r.result.code, message: r.result.message }
        });
        return;
      }
      state = r.state;
    }

    writeState(state);
    sendJson(res, 200, { ok: true, processed: events.length, cloud: cloudStateToPlain(state) });
    return;
  }

  sendJson(res, 404, { error: { code: 'not_found', message: 'route not found' } });
});

server.listen(PORT, () => {
  console.log(`demo-sync-server listening on http://127.0.0.1:${PORT}`);
  console.log(`state file: ${statePath}`);
});
