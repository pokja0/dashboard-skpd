<script lang="ts">
  let {
    values,
    color = 'var(--primary)',
    height = 36,
    label = 'Tren'
  }: {
    values: number[];
    color?: string;
    height?: number;
    label?: string;
  } = $props();

  const W = 100;
  const H = 32;

  const min = $derived(Math.min(...values));
  const max = $derived(Math.max(...values));
  const span = $derived(max - min || 1);

  const coords = $derived(
    values.map((value, index) => {
      const x = values.length === 1 ? W / 2 : (index / (values.length - 1)) * W;
      const y = H - 4 - ((value - min) / span) * (H - 8);
      return { x, y };
    })
  );

  const line = $derived(coords.map((point) => `${point.x},${point.y}`).join(' '));
  const last = $derived(coords[coords.length - 1]);
</script>

<svg
  viewBox={`0 0 ${W} ${H}`}
  style={`height:${height}px`}
  role="img"
  aria-label={`${label}: ${values.map((value) => Math.round(value)).join(', ')}`}
  preserveAspectRatio="none"
>
  <title>{label}</title>
  <line x1="0" x2={W} y1={H - 2} y2={H - 2} stroke="var(--line)" stroke-width="1" />
  <polyline
    points={line}
    fill="none"
    stroke={color}
    stroke-width="2.2"
    stroke-linecap="round"
    stroke-linejoin="round"
    vector-effect="non-scaling-stroke"
  />
  {#if last}
    <circle cx={last.x} cy={last.y} r="2.6" fill={color} stroke="var(--surface)" stroke-width="1.4" />
  {/if}
</svg>

<style>
  svg {
    width: 100%;
    overflow: visible;
  }
</style>
