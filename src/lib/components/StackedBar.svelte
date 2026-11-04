<script lang="ts">
  import { num } from '#lib/format';

  export type StackSegment = { label: string; value: number; color: string };

  let {
    segments,
    total,
    height = 14,
    ariaLabel = 'Komposisi'
  }: {
    segments: StackSegment[];
    total?: number;
    height?: number;
    ariaLabel?: string;
  } = $props();

  const computedTotal = $derived(total ?? segments.reduce((sum, item) => sum + item.value, 0));
</script>

<div
  class="stacked-bar"
  style={`--h:${height}px`}
  role="img"
  aria-label={`${ariaLabel}: ${segments.map((s) => `${s.label} ${num(s.value)}`).join(', ')}`}
>
  {#each segments.filter((segment) => segment.value > 0) as segment}
    <span
      style={`width:${computedTotal ? (segment.value / computedTotal) * 100 : 0}%;background:${segment.color}`}
      title={`${segment.label}: ${num(segment.value)}`}
    ></span>
  {/each}
</div>

<style>
  .stacked-bar {
    display: flex;
    width: 100%;
    height: var(--h);
    border-radius: 999px;
    background: var(--line);
    overflow: hidden;
  }

  .stacked-bar span {
    display: block;
    height: 100%;
    min-width: 2px;
  }
</style>
