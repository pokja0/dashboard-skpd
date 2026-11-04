<script lang="ts">
  import Icon from './Icon.svelte';

  type Chip = { text: string; tone?: 'primary' | 'gold' | 'danger' | 'travel' | 'default' };

  let {
    icon,
    label,
    value,
    suffix = '',
    detail,
    chips = [],
    accent = 'var(--primary)',
    meter = null,
    meterTone = 'primary'
  }: {
    icon: string;
    label: string;
    value: string;
    suffix?: string;
    detail: string;
    chips?: Chip[];
    accent?: string;
    meter?: number | null;
    meterTone?: 'primary' | 'gold' | 'danger' | 'travel';
  } = $props();
</script>

<article class="kpi-card" style={`--accent:${accent}`}>
  <div class="kpi-top">
    <span class="kpi-icon"><Icon name={icon} size={19} /></span>
    <span class="kpi-label">{label}</span>
  </div>
  <p class="kpi-value">{value}{#if suffix}<small>{suffix}</small>{/if}</p>
  <p class="kpi-detail">{detail}</p>
  {#if meter !== null}
    <div class="kpi-meter" aria-hidden="true">
      <span class={`tone-${meterTone}`} style={`width:${Math.max(0, Math.min(100, meter))}%`}></span>
    </div>
  {/if}
  <div class="kpi-foot">
    {#each chips as chip}
      <span class:primary={chip.tone === 'primary'} class:gold={chip.tone === 'gold'} class:danger={chip.tone === 'danger'} class:travel={chip.tone === 'travel'} class="chip">
        {chip.text}
      </span>
    {/each}
  </div>
</article>

<style>
  .kpi-meter {
    height: 5px;
    margin-top: 0.8rem;
    border-radius: 999px;
    background: var(--line);
    overflow: hidden;
  }

  .kpi-meter span {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: var(--primary);
  }

  .kpi-meter span.tone-gold {
    background: var(--gold);
  }

  .kpi-meter span.tone-danger {
    background: var(--danger);
  }

  .kpi-meter span.tone-travel {
    background: var(--travel);
  }
</style>
