<script lang="ts">
  import { num, pct } from '#lib/format';
  import type { DestinationCount } from '#lib/data';

  let {
    items,
    total,
    limit = 8,
    color = 'var(--primary)'
  }: {
    items: DestinationCount[];
    total: number;
    limit?: number;
    color?: string;
  } = $props();

  const shown = $derived(items.slice(0, limit));
  const max = $derived(Math.max(1, ...shown.map((item) => item.count)));
</script>

<div class="destination-chart">
  {#each shown as item, index}
    <div class="destination-row">
      <span class="destination-rank">{index + 1}</span>
      <div class="destination-main">
        <div class="destination-head">
          <span class="destination-name">{item.name}</span>
          <span class="destination-value">
            {num(item.count)}
            <small>{pct(total ? (item.count / total) * 100 : 0)}</small>
          </span>
        </div>
        <div class="destination-track">
          <span style={`width:${(item.count / max) * 100}%;background:${color}`}></span>
        </div>
      </div>
    </div>
  {/each}

  {#if shown.length === 0}
    <div class="empty-state">
      <strong>Tidak ada data perjalanan.</strong>
      Belum ada perjalanan pada periode ini.
    </div>
  {/if}
</div>
