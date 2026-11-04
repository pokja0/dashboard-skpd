<script lang="ts">
  import { unitMonogram, type DashboardUnit } from '#lib/data';
  import { dashboard } from '#lib/dashboard';
  import { num, pct, decimal, truncate } from '#lib/format';
  import Icon from '#lib/components/Icon.svelte';
  import DateRangeFilter from '#lib/components/DateRangeFilter.svelte';
  import { downloadUnitsPdf, downloadUnitsXlsx } from '#lib/export';

  type Category = 'attendance' | 'disposition' | 'travel' | 'reward';
  type Group = 'Semua' | DashboardUnit['group'];

  const data = $derived($dashboard);
  const summary = $derived(data.summary);
  const units = $derived(data.units);

  let category = $state<Category>('attendance');
  let query = $state('');
  let group = $state<Group>('Semua');
  let sortDesc = $state(true);

  const groups: Group[] = ['Semua', 'Sekretariat Daerah', 'Badan', 'Dinas', 'Lembaga'];
  const categories: Array<{ id: Category; label: string; icon: string }> = [
    { id: 'attendance', label: 'Kehadiran', icon: 'users' },
    { id: 'disposition', label: 'Disposisi', icon: 'mail' },
    { id: 'travel', label: 'Perjalanan', icon: 'plane' },
    { id: 'reward', label: 'Nilai R&P', icon: 'target' }
  ];

  const maxTravel = $derived(Math.max(1, ...units.map((unit) => unit.travel.total)));

  function metricValue(unit: DashboardUnit): number {
    if (category === 'attendance') return unit.attendance.pct;
    if (category === 'disposition') return unit.disposition.pct ?? -1;
    if (category === 'reward') return unit.reward;
    return unit.travel.total;
  }

  const filtered = $derived.by(() => {
    const needle = query.trim().toLowerCase();
    const list = units.filter((unit) => {
      const matchesGroup = group === 'Semua' || unit.group === group;
      const matchesQuery =
        !needle ||
        unit.short.toLowerCase().includes(needle) ||
        unit.name.toLowerCase().includes(needle) ||
        unit.head.toLowerCase().includes(needle);
      return matchesGroup && matchesQuery;
    });
    list.sort((a, b) => {
      const diff = metricValue(b) - metricValue(a);
      return sortDesc ? diff : -diff;
    });
    return list;
  });

  function attendanceWidth(unit: DashboardUnit): number {
    return unit.attendance.pct;
  }

  function travelWidth(unit: DashboardUnit): number {
    return (unit.travel.total / maxTravel) * 100;
  }

  function resetFilters() {
    query = '';
    group = 'Semua';
    category = 'attendance';
    sortDesc = true;
  }

  let exporting = $state<'pdf' | 'xlsx' | null>(null);
  let exportError = $state('');

  async function exportPdf() {
    exporting = 'pdf';
    exportError = '';
    try {
      await downloadUnitsPdf(filtered, data.meta);
    } catch {
      exportError = 'Unduhan PDF gagal. Muat ulang halaman lalu coba lagi.';
    } finally {
      exporting = null;
    }
  }

  async function exportXlsx() {
    exporting = 'xlsx';
    exportError = '';
    try {
      await downloadUnitsXlsx(filtered, data.meta);
    } catch {
      exportError = 'Unduhan XLSX gagal. Muat ulang halaman lalu coba lagi.';
    } finally {
      exporting = null;
    }
  }
</script>

<svelte:head>
  <title>Perangkat Daerah — Dashboard Kinerja 2026</title>
  <meta
    name="description"
    content="Daftar 41 Perangkat Daerah Provinsi Sulawesi Barat dengan kehadiran rapat, penyelesaian disposisi, dan perjalanan dinas 2026."
  />
</svelte:head>

<section class="wrap page-head">
  <span class="eyebrow">Rincian</span>
  <h1>Daftar Perangkat Daerah.</h1>
  <p class="lede">
    Cari unit, saring kelompok, dan urutkan menurut kategori. Klik unit untuk melihat rincian.
  </p>
  <div class="page-head-meta">
    <span class="chip primary"><Icon name="users" size={13} /> {units.length} unit</span>
    <span class="chip"><Icon name="calendar" size={13} /> {data.meta.periodLabel}</span>
    <div class="head-actions">
      <button class="btn ghost small" type="button" onclick={exportPdf} disabled={exporting !== null}>
        <Icon name="download" size={15} /> {exporting === 'pdf' ? 'Menyiapkan…' : 'Unduh PDF'}
      </button>
      <button class="btn ghost small" type="button" onclick={exportXlsx} disabled={exporting !== null}>
        <Icon name="download" size={15} /> {exporting === 'xlsx' ? 'Menyiapkan…' : 'Unduh XLSX'}
      </button>
    </div>
  </div>
  {#if exportError}
    <div class="callout danger" role="alert" style="margin-top:0.8rem">
      <Icon name="alert" size={17} />
      <span>{exportError}</span>
    </div>
  {/if}
</section>

<div class="wrap range-shell">
  <DateRangeFilter />
</div>

<section class="wrap section-tight">
  <div class="stat-strip" aria-label="Ringkasan data">
    <div>
      <span>Catatan kehadiran</span>
      <strong>{num(summary.attendance.total)}</strong>
    </div>
    <div>
      <span>Surat disposisi</span>
      <strong>{num(summary.disposition.total)}</strong>
    </div>
    <div>
      <span>Perjalanan dinas</span>
      <strong>{num(summary.travel.total)}</strong>
    </div>
    <div>
      <span>Hari perjalanan</span>
      <strong>{num(summary.travel.days)}</strong>
    </div>
  </div>
</section>

<section class="wrap section-tight">
  <div class="toolbar" aria-label="Filter dan pencarian Perangkat Daerah">
    <div class="search-box">
      <Icon name="search" size={16} />
      <label class="sr-only" for="cari-unit">Cari Perangkat Daerah atau nama kepala</label>
      <input
        id="cari-unit"
        type="search"
        placeholder="Cari unit atau nama kepala…"
        bind:value={query}
        autocomplete="off"
      />
    </div>

    <div class="toolbar-group">
      <div class="segmented" role="tablist" aria-label="Kategori utama">
        {#each categories as item}
          <button
            type="button"
            role="tab"
            aria-selected={category === item.id}
            class:active={category === item.id}
            onclick={() => (category = item.id)}
          >{item.label}</button>
        {/each}
      </div>

      <button
        class="btn ghost small"
        type="button"
        onclick={() => (sortDesc = !sortDesc)}
        aria-label={`Urutkan ${sortDesc ? 'tertinggi' : 'terendah'}`}
      >
        <Icon name={sortDesc ? 'chevron-down' : 'chevron-up'} size={14} />
        {sortDesc ? 'Tertinggi' : 'Terendah'}
      </button>
    </div>
  </div>

  <div class="filter-chips" style="margin-top:0.6rem" aria-label="Saring kelompok unit">
    {#each groups as item}
      <button
        type="button"
        class="filter-chip"
        class:active={group === item}
        aria-pressed={group === item}
        onclick={() => (group = item)}
      >{item}</button>
    {/each}
  </div>

  <p class="fineprint" style="margin-top:0.7rem" aria-live="polite">
    Menampilkan {filtered.length} dari {units.length} unit · diurutkan menurut
    {categories.find((item) => item.id === category)?.label.toLowerCase()} {sortDesc ? 'tertinggi' : 'terendah'}.
  </p>

  <h2 class="sr-only">Daftar Perangkat Daerah</h2>

  <div class="table-shell">
    <table class="data-table">
      <caption class="sr-only">
        Daftar Perangkat Daerah beserta kehadiran rapat, penyelesaian disposisi, nilai reward dan
        punishment, dan perjalanan dinas periode {data.meta.periodLabel}.
      </caption>
      <thead>
        <tr>
          <th scope="col" class="no-cell">No</th>
          <th scope="col">Perangkat Daerah</th>
          <th scope="col">Kehadiran</th>
          <th scope="col">Disposisi</th>
          <th scope="col">Nilai R&amp;P</th>
          <th scope="col">Perjalanan</th>
          <th scope="col"><span class="sr-only">Detail</span></th>
        </tr>
      </thead>
      <tbody>
        {#each filtered as unit, index}
          <tr>
            <td class="no-cell">{index + 1}</td>
            <td>
              <a class="unit-cell" href={`/perangkat-daerah/${unit.id}`}>
                <span class="unit-avatar">{unitMonogram(unit.short)}</span>
                <span class="unit-cell-text">
                  <strong class="unit-name">
                    <span>{unit.short}</span>
                    {#if unit.headChanged}
                      <span class="head-change-badge">Pergantian</span>
                    {/if}
                  </strong>
                  <span>{truncate(unit.head, 48)}</span>
                </span>
              </a>
            </td>
            <td>
              <div class="metric-cell">
                <div class="metric-line">
                  <strong>{pct(unit.attendance.pct)}</strong>
                  <span>{num(unit.attendance.present)}/{num(unit.attendance.total)}</span>
                </div>
                <div class="metric-track"><span style={`width:${attendanceWidth(unit)}%`}></span></div>
              </div>
            </td>
            <td>
              <div class="metric-cell">
                <div class="metric-line">
                  <strong>{pct(unit.disposition.pct)}</strong>
                  <span>
                    {unit.disposition.total
                      ? `${num(unit.disposition.done)}/${num(unit.disposition.total)}`
                      : 'tidak ada'}
                  </span>
                </div>
                <div class="metric-track gold">
                  <span style={`width:${unit.disposition.pct ?? 0}%`}></span>
                </div>
              </div>
            </td>
            <td>
              <div class="metric-cell">
                <div class="metric-line">
                  <strong>{decimal(unit.reward)}</strong>
                  <span>{unit.disposition.total ? '/ 30' : '/ 30*'}</span>
                </div>
                <div class="metric-track gold">
                  <span style={`width:${(unit.reward / 30) * 100}%`}></span>
                </div>
              </div>
            </td>
            <td>
              <div class="metric-cell">
                <div class="metric-line">
                  <strong>{num(unit.travel.total)}</strong>
                  <span>{num(unit.travel.days)} hari</span>
                </div>
                <div class="metric-track travel"><span style={`width:${travelWidth(unit)}%`}></span></div>
              </div>
            </td>
            <td class="num">
              <a class="row-link" href={`/perangkat-daerah/${unit.id}`} aria-label={`Buka detail ${unit.short}`}>
                <Icon name="arrow-right" size={15} />
              </a>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
    {#if filtered.length === 0}
      <div class="empty-state">
        <strong>Tidak ada unit yang cocok.</strong>
        Coba kata kunci lain atau <button class="btn quiet small" type="button" onclick={resetFilters}>reset filter</button>.
      </div>
    {/if}
    <div class="table-foot">
      <span>{filtered.length} unit ditampilkan</span>
      <span>Klik nama unit untuk membuka profil</span>
    </div>
  </div>

  <p class="fineprint" style="margin-top:0.6rem">
    * Komponen kehadiran atau disposisi yang tidak memiliki catatan dianggap 100% pada
    perhitungan Nilai R&amp;P.
  </p>

  <div class="unit-cards" aria-label="Daftar Perangkat Daerah">
    {#each filtered as unit, index}
      <a class="unit-card" href={`/perangkat-daerah/${unit.id}`}>
        <div class="unit-card-top">
          <div>
            <h3>
              {unit.short}
              {#if unit.headChanged}<span class="head-change-badge">Pergantian</span>{/if}
            </h3>
            <p class="head">{truncate(unit.head, 46)}</p>
          </div>
          <div class="unit-card-badges">
            <span class="unit-card-no">{index + 1}</span>
            <span class="unit-avatar">{unitMonogram(unit.short)}</span>
          </div>
        </div>
        <div class="unit-card-metrics">
          <div class="unit-card-metric">
            <span>Hadir</span>
            <strong>{pct(unit.attendance.pct)}</strong>
            <small>{num(unit.attendance.present)}/{num(unit.attendance.total)}</small>
          </div>
          <div class="unit-card-metric">
            <span>Disposisi</span>
            <strong>{pct(unit.disposition.pct)}</strong>
            <small>{unit.disposition.total ? `${num(unit.disposition.done)}/${num(unit.disposition.total)}` : 'tidak ada'}</small>
          </div>
          <div class="unit-card-metric">
            <span>Nilai R&amp;P</span>
            <strong>{decimal(unit.reward)}</strong>
            <small>{unit.disposition.total ? '/ 30' : '/ 30*'}</small>
          </div>
          <div class="unit-card-metric">
            <span>Trip</span>
            <strong>{num(unit.travel.total)}</strong>
            <small>{num(unit.travel.days)} hari</small>
          </div>
        </div>
      </a>
    {/each}
    {#if filtered.length === 0}
      <div class="empty-state">
        <strong>Tidak ada unit yang cocok.</strong>
        Coba kata kunci lain atau <button class="btn quiet small" type="button" onclick={resetFilters}>reset filter</button>.
      </div>
    {/if}
  </div>
</section>
