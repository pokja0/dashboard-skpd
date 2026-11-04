<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import Icon from '#lib/components/Icon.svelte';
  import {
    availableLabel,
    CURRENT_MONTH,
    dashboard,
    DATA_MAX,
    DATA_MIN,
    monthOptions,
    range,
    RANGE_STORAGE_KEY,
    setFrom,
    setFullRange,
    setMonth,
    setRange,
    setTo
  } from '#lib/dashboard';

  onMount(() => {
    const saved = sessionStorage.getItem(RANGE_STORAGE_KEY);
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

  const selectedMonth = $derived(
    $range.from.slice(0, 7) === $range.to.slice(0, 7)
      ? $range.from.slice(0, 7)
      : 'custom'
  );

  const isCurrentPartial = $derived(
    $range.from.slice(0, 7) === CURRENT_MONTH && $range.to === DATA_MAX
  );

  function onMonthChange(event: Event) {
    const select = event.currentTarget as HTMLSelectElement;
    if (select.value !== 'custom') setMonth(select.value);
  }

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

<section class="range-bar" aria-label="Filter periode penilaian">
  <div class="range-intro">
    <Icon name="calendar" size={18} />
    <div>
      <strong>Periode penilaian</strong>
      <span aria-live="polite">
        {$dashboard.meta.periodLabel} · {$dashboard.meta.days} hari {#if isCurrentPartial}· belum lengkap, R&amp;P sementara{/if}
      </span>
    </div>
  </div>

  <div class="range-fields">
    <label class="range-field">
      <span>Bulan</span>
      <select value={selectedMonth} onchange={onMonthChange} aria-label="Pilih bulan penilaian">
        {#each monthOptions as option}
          <option value={option.value}>{option.label}</option>
        {/each}
        {#if selectedMonth === 'custom'}
          <option value="custom">Rentang khusus</option>
        {/if}
      </select>
    </label>

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

    <div class="range-actions">
      <button
        class="btn ghost small"
        type="button"
        onclick={() => setMonth(CURRENT_MONTH)}
      >
        <Icon name="calendar" size={13} /> Bulan berjalan
      </button>
      <button class="btn ghost small" type="button" onclick={setFullRange}>
        Semua data
      </button>
    </div>
  </div>

  <span class="range-available">
    Data tersedia {availableLabel} · default bulan lengkap terakhir
  </span>
</section>
