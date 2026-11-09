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
    fullRange,
    monthForRange,
    monthOptions,
    range,
    RANGE_STORAGE_KEY,
    setFrom,
    setFullRange,
    setMonth,
    setRange,
    setTo
  } from '#lib/dashboard';

  let forceCustom = $state(false);

  onMount(() => {
    const saved = sessionStorage.getItem(RANGE_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { from?: string; to?: string };
        if (parsed.from && parsed.to) {
          setRange(parsed.from, parsed.to);
          const savedRange = { from: parsed.from, to: parsed.to };
          const isFullRange =
            savedRange.from === fullRange.from && savedRange.to === fullRange.to;
          forceCustom = !isFullRange && monthForRange(savedRange) === null;
        }
      } catch {
        // ignore invalid stored value
      }
    } else {
      setRange(get(range).from, get(range).to);
    }
  });

  const isAllMonths = $derived(
    $range.from === fullRange.from && $range.to === fullRange.to
  );
  const selectedMonth = $derived(
    forceCustom ? 'custom' : isAllMonths ? 'all' : (monthForRange($range) ?? 'custom')
  );
  const isCustom = $derived(selectedMonth === 'custom');
  const isCurrentPartial = $derived(
    $range.from.slice(0, 7) === CURRENT_MONTH && $range.to === DATA_MAX
  );
  const allMonthsLabel = $derived.by(() => {
    const latest = monthOptions[0]?.label.replace(' (berjalan)', '') ?? 'terbaru';
    const earliest = monthOptions[monthOptions.length - 1]?.label.split(' ')[0] ?? 'Januari';
    return `Semua bulan (${earliest}–${latest})`;
  });

  function onMonthChange(event: Event) {
    const select = event.currentTarget as HTMLSelectElement;
    if (select.value === 'all') {
      forceCustom = false;
      setFullRange();
      return;
    }
    if (select.value === 'custom') {
      forceCustom = true;
      return;
    }
    forceCustom = false;
    setMonth(select.value);
  }

  function onFromChange(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    forceCustom = true;
    setFrom(input.value);
    input.value = get(range).from;
  }

  function onToChange(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    forceCustom = true;
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
        {$dashboard.meta.periodLabel} · {$dashboard.meta.days} hari {#if isCurrentPartial}· belum lengkap{/if}
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
        <option value="all">{allMonthsLabel}</option>
        <option value="custom">Rentang khusus</option>
      </select>
    </label>

    {#if isCustom}
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
    {/if}
  </div>

  <span class="range-available">Data tersedia {availableLabel}</span>
</section>
