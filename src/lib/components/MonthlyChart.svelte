<script lang="ts">
  import { num } from '#lib/format';

  type Series = { key: string; label: string; color: string };
  type Point = Record<string, number | string | undefined>;

  let {
    points,
    series,
    labels,
    height = 132,
    note = '',
    ariaLabel = 'Grafik bulanan',
    mutedIndex = -1
  }: {
    points: Point[];
    series: Series[];
    labels: string[];
    height?: number;
    note?: string;
    ariaLabel?: string;
    mutedIndex?: number;
  } = $props();

  const W = 330;
  const H = $derived(height);
  const padTop = 20;
  const padBottom = 22;
  const chartH = $derived(H - padTop - padBottom);
  const slot = $derived(W / Math.max(points.length, 1));
  const barW = $derived(Math.min(24, slot * 0.58));

  const totals = $derived(
    points.map((point) => series.reduce((sum, item) => sum + (Number(point[item.key]) || 0), 0))
  );
  const max = $derived(Math.max(1, ...totals));
  const gridValues = $derived([0.33, 0.66, 1].map((step) => Math.round(max * step)));
  const chartSummary = $derived(
    `${ariaLabel}. ${points.map((_, index) => `${labels[index]}: ${num(totals[index])}`).join('; ')}`
  );

  let activeIndex = $state<number | null>(null);

  const activePoint = $derived(activeIndex === null ? null : points[activeIndex]);
  const activeTotal = $derived(activeIndex === null ? 0 : totals[activeIndex]);
  const activeX = $derived(activeIndex === null ? 0 : activeIndex * slot + slot / 2);
  const tooltipW = 176;
  const tooltipH = $derived(24 + series.length * 13);
  const tooltipX = $derived(
    Math.max(3, Math.min(W - 3 - tooltipW, activeX - tooltipW / 2))
  );

  $effect(() => {
    if (activeIndex !== null && activeIndex >= points.length) activeIndex = null;
  });

  function value(point: Point, key: string): number {
    return Number(point[key]) || 0;
  }

  function barHeight(v: number): number {
    return v > 0 ? Math.max(2, (v / max) * chartH) : 0;
  }
</script>

<figure class="monthly-chart" aria-label={chartSummary}>
  <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={chartSummary}>
    <title>{chartSummary}</title>
    {#each gridValues as grid}
      <line
        x1="4"
        x2={W - 4}
        y1={padTop + chartH - (grid / max) * chartH}
        y2={padTop + chartH - (grid / max) * chartH}
        stroke="var(--line)"
        stroke-width="1"
        stroke-dasharray="2 4"
      />
    {/each}

    {#each points as point, index}
      {@const total = totals[index]}
      {@const x = index * slot + (slot - barW) / 2}
      <g
        class="bar-group"
        opacity={index === mutedIndex ? 0.42 : 1}
        role="presentation"
        onmouseenter={() => (activeIndex = index)}
        onmouseleave={() => (activeIndex = null)}
      >
        {#if total > 0}
          {@const topY = padTop + chartH - barHeight(total)}
          <text
            x={x + barW / 2}
            y={topY - 5}
            text-anchor="middle"
            font-size="7.5"
            font-weight="700"
            fill="var(--ink-2)"
          >{num(total)}</text>
        {/if}
        {#each series as item, seriesIndex}
          {@const v = value(point, item.key)}
          {@const h = barHeight(v)}
          {@const y = padTop + chartH - h - series.slice(seriesIndex + 1).reduce((sum, s) => sum + barHeight(value(point, s.key)), 0)}
          {#if v > 0}
            <rect
              x={x}
              y={y}
              width={barW}
              height={h}
              rx="1.6"
              fill={item.color}
              opacity={seriesIndex === 0 ? 1 : 0.9}
            />
          {/if}
        {/each}
        <text
          x={x + barW / 2}
          y={H - 7}
          text-anchor="middle"
          font-size="7.5"
          font-weight="650"
          fill="var(--muted)"
        >{labels[index]}</text>
      </g>
    {/each}

    <line
      x1="4"
      x2={W - 4}
      y1={padTop + chartH}
      y2={padTop + chartH}
      stroke="var(--line-strong)"
      stroke-width="1"
    />

    {#if activePoint}
      <g
        class="bar-tooltip"
        transform={`translate(${tooltipX}, 2)`}
        aria-hidden="true"
        pointer-events="none"
      >
        <rect width={tooltipW} height={tooltipH} rx="5" fill="var(--ink)" opacity="0.98" />
        <text x="9" y="15" font-size="12" font-weight="800" fill="#ffffff">
          {labels[activeIndex ?? 0]} · {num(activeTotal)}
        </text>
        {#each series as item, seriesIndex}
          <text x="9" y={31 + seriesIndex * 13} font-size="10.5" fill="#dce9f8">
            {item.label}: {num(value(activePoint, item.key))}
          </text>
        {/each}
      </g>
    {/if}
  </svg>

  {#if series.length > 1}
    <div class="chart-legend">
      {#each series as item}
        <span class="legend-item">
          <span class="legend-dot" style={`--dot:${item.color}`}></span>
          {item.label}
        </span>
      {/each}
    </div>
  {/if}
  {#if note}
    <p class="chart-note">{note}</p>
  {/if}
</figure>

<style>
  .monthly-chart {
    position: relative;
    display: grid;
    gap: 0;
    margin: 0;
  }

  svg {
    width: 100%;
    height: auto;
    overflow: visible;
  }

  .bar-group {
    cursor: default;
    transition: opacity 0.15s ease;
  }

  .bar-group:hover {
    opacity: 0.9;
  }

  .bar-tooltip {
    pointer-events: none;
  }

  @media (prefers-reduced-motion: no-preference) {
    .bar-group rect {
      transform-box: fill-box;
      transform-origin: bottom;
      animation: bar-rise 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
    }
  }

  @keyframes bar-rise {
    from {
      transform: scaleY(0.05);
      opacity: 0.4;
    }
    to {
      transform: scaleY(1);
      opacity: 1;
    }
  }
</style>
