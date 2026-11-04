<script lang="ts">
  import { num } from '#lib/format';

  export type Segment = { label: string; value: number; color: string };

  let {
    segments,
    total,
    centerValue,
    centerLabel = 'total',
    size = 154
  }: {
    segments: Segment[];
    total?: number;
    centerValue?: string;
    centerLabel?: string;
    size?: number;
  } = $props();

  const circumference = 2 * Math.PI * 42;
  const computedTotal = $derived(total ?? segments.reduce((sum, item) => sum + item.value, 0));

  const arcs = $derived.by(() => {
    let offset = 0;
    return segments
      .filter((segment) => segment.value > 0)
      .map((segment) => {
        const fraction = computedTotal ? segment.value / computedTotal : 0;
        const length = fraction * circumference;
        const arc = {
          ...segment,
          dash: Math.max(0, length - 1.6),
          gap: circumference - Math.max(0, length - 1.6),
          offset: -offset
        };
        offset += length;
        return arc;
      });
  });
</script>

<div class="donut" style={`--size:${size}px`}>
  <svg viewBox="0 0 120 120" role="img" aria-label={`Komposisi ${centerLabel}: ${segments.map((s) => `${s.label} ${num(s.value)}`).join(', ')}`}>
    <title>{`Komposisi ${centerLabel}`}</title>
    <circle cx="60" cy="60" r="42" fill="none" stroke="var(--line)" stroke-width="13" />
    {#each arcs as arc}
      <circle
        cx="60"
        cy="60"
        r="42"
        fill="none"
        stroke={arc.color}
        stroke-width="13"
        stroke-linecap="butt"
        stroke-dasharray={`${arc.dash} ${arc.gap}`}
        stroke-dashoffset={arc.offset}
        transform="rotate(-90 60 60)"
      >
        <title>{arc.label}: {num(arc.value)}</title>
      </circle>
    {/each}
  </svg>
  <div class="donut-center">
    <strong>{centerValue ?? num(computedTotal)}</strong>
    <span>{centerLabel}</span>
  </div>
</div>

<style>
  .donut {
    position: relative;
    flex: 0 0 auto;
    width: var(--size);
    height: var(--size);
  }

  svg {
    width: 100%;
    height: 100%;
    overflow: visible;
  }

  .donut-center {
    position: absolute;
    inset: 0;
    display: grid;
    place-content: center;
    justify-items: center;
    pointer-events: none;
    text-align: center;
  }

  .donut-center strong {
    color: var(--ink);
    font-size: calc(var(--size) * 0.17);
    font-weight: 800;
    letter-spacing: -0.04em;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }

  .donut-center span {
    margin-top: 0.2rem;
    color: var(--muted);
    font-size: calc(var(--size) * 0.07);
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
</style>
