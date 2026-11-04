<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import Icon from '#lib/components/Icon.svelte';
  import {
    availableLabel,
    dashboard,
    DATA_MAX,
    DATA_MIN,
    range,
    resetRange,
    setFrom,
    setRange,
    setTo
  } from '#lib/dashboard';

  onMount(() => {
    const saved = sessionStorage.getItem('dashboard-range');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { from?: string; to?: string };
        if (parsed.from && parsed.to) setRange(parsed.from, parsed.to);
      } catch {
        // ignore invalid stored value
      }
    } else {
      setRange(get(range).from, get(range).to);
    }
  });

  function onFromChange(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    setFrom(input.value);
    input.value = get(range).from;
  }

  function onToChange(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    setTo(input.value);
    input.value = get(range).to;
  }
</script>

<section class="range-bar" aria-label="Filter periode data">
    <div class="range-intro">
      <Icon name="calendar" size={18} />
      <div>
        <strong>Periode data</strong>
        <span aria-live="polite">{$dashboard.meta.periodLabel} · {$dashboard.meta.days} hari</span>
      </div>
    </div>

    <div class="range-fields">
      <label class="range-field">
        <span>Mulai</span>
        <input
          type="date"
          min={DATA_MIN}
          max={DATA_MAX}
          value={$range.from}
          onchange={onFromChange}
        />
      </label>
      <span class="range-dash" aria-hidden="true">–</span>
      <label class="range-field">
        <span>Selesai</span>
        <input
          type="date"
          min={DATA_MIN}
          max={DATA_MAX}
          value={$range.to}
          onchange={onToChange}
        />
      </label>
      <button class="btn ghost small range-reset" type="button" onclick={resetRange}>
        <Icon name="x" size={13} /> Semua
      </button>
    </div>

    <span class="range-available">Data tersedia {availableLabel}</span>
  </section>
