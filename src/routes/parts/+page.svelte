<script lang="ts">
  import type { PartOrder } from '$lib/types/fleet';

  type PartWithJob = PartOrder & { jobTitle?: string; vehicleName?: string };

  let { data }: { data: { parts: PartWithJob[] } } = $props();

  const statusLabels: Record<string, string> = {
    ordered: 'Ordered',
    shipped: 'Shipped',
    received: 'Received'
  };
</script>

<div class="parts-page">
  <header class="page-header">
    <div>
      <h1>Parts on order</h1>
      <p class="subtitle">Track orders and link to maintenance jobs</p>
    </div>
  </header>

  <div class="card table-container">
    <table class="table">
      <thead>
        <tr>
          <th>Part</th>
          <th>Quantity</th>
          <th>Order date</th>
          <th>Expected delivery</th>
          <th>Status</th>
          <th>Related job</th>
        </tr>
      </thead>
      <tbody>
        {#each data.parts as part (part.id)}
          <tr>
            <td class="font-medium">{part.partName}</td>
            <td>{part.quantity}</td>
            <td class="text-muted">{part.orderDate || '—'}</td>
            <td class="text-muted">{part.expectedDelivery || '—'}</td>
            <td><span class="badge badge-{part.status}">{statusLabels[part.status]}</span></td>
            <td>
              {#if part.maintenanceJobId}
                <a href="/maintenance#job-{part.maintenanceJobId}" class="link-accent">
                  {part.jobTitle ?? part.maintenanceJobId}
                </a>
                {#if part.vehicleName}
                  <span class="text-muted text-sm block">{part.vehicleName}</span>
                {/if}
              {:else}
                <span class="text-muted">—</span>
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
