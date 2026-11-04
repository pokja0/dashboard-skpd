<script lang="ts">
  import type { PageProps } from './$types';
  import {
    dataset,
    statusColors,
    statusOrder,
    unitInitials,
    type AttendanceRecord,
    type AttendanceStatus
  } from '#lib/data';
  import { dashboard } from '#lib/dashboard';
  import { num, pct, decimal, dateISO, truncate, titleCase } from '#lib/format';
  import Icon from '#lib/components/Icon.svelte';
  import Donut from '#lib/components/Donut.svelte';
  import Sparkline from '#lib/components/Sparkline.svelte';
  import DestinationChart from '#lib/components/DestinationChart.svelte';
  import DateRangeFilter from '#lib/components/DateRangeFilter.svelte';
  import { downloadUnitPdf, downloadUnitXlsx } from '#lib/export';

  let { data }: PageProps = $props();

  const unit = $derived(
    $dashboard.units.find((item) => item.id === data.unit.id) ?? $dashboard.units[0]
  );
  const summary = $derived($dashboard.summary);
  const periodLabel = $derived($dashboard.meta.periodLabel);

  let activeList = $state<'dispositions' | 'travel' | 'attendance'>('dispositions');

  const statusSegments = $derived(
    statusOrder.map((status: AttendanceStatus) => ({
      label: status,
      value: unit.attendance.statuses[status],
      color: statusColors[status]
    }))
  );

  const attTrend = $derived(
    unit.monthly.attendance.map((point) =>
      point.total ? ((point.present ?? 0) / point.total) * 100 : 0
    )
  );
  const dispTrend = $derived(unit.monthly.disposition.map((point) => point.total || 0));
  const travTrend = $derived(unit.monthly.travel.map((point) => point.total || 0));

  const peers = $derived(
    $dashboard.units
      .filter((item) => item.group === unit.group && item.id !== unit.id)
      .sort((a, b) => b.attendance.pct - a.attendance.pct)
      .slice(0, 6)
  );

  const fullDispositions = $derived(unit.records.dispositions);
  const fullTravel = $derived(unit.records.travel);
  const fullAttendance = $derived(unit.records.attendance);

  const tabs = $derived([
    { id: 'dispositions' as const, label: 'Disposisi', count: fullDispositions.length },
    { id: 'travel' as const, label: 'Perjalanan', count: fullTravel.length },
    { id: 'attendance' as const, label: 'Kehadiran', count: fullAttendance.length }
  ]);

  let activeFilter = $state('all');

  const filterOptions = $derived.by((): Array<{ id: string; label: string; count: number }> => {
    if (activeList === 'dispositions') {
      return [
        { id: 'all', label: 'Semua', count: fullDispositions.length },
        { id: 'Selesai', label: 'Selesai', count: fullDispositions.filter((item) => item.status === 'Selesai').length },
        { id: 'Belum', label: 'Belum', count: fullDispositions.filter((item) => item.status === 'Belum').length }
      ];
    }
    if (activeList === 'travel') {
      return [
        { id: 'all', label: 'Semua', count: fullTravel.length },
        { id: 'Dalam Daerah', label: 'Dalam daerah', count: fullTravel.filter((item) => item.kind === 'Dalam Daerah').length },
        { id: 'Luar Daerah', label: 'Luar daerah', count: fullTravel.filter((item) => item.kind === 'Luar Daerah').length }
      ];
    }
    return [
      { id: 'all', label: 'Semua', count: fullAttendance.length },
      { id: 'Hadir', label: 'Hadir', count: fullAttendance.filter((item) => item.status === 'Hadir').length },
      { id: 'Dinas Luar', label: 'Dinas luar', count: fullAttendance.filter((item) => item.status === 'Dinas Luar').length },
      { id: 'Diwakili', label: 'Diwakili', count: fullAttendance.filter((item) => item.status === 'Diwakili').length },
      { id: 'Sakit', label: 'Sakit', count: fullAttendance.filter((item) => item.status === 'Sakit').length },
      { id: 'Izin', label: 'Izin', count: fullAttendance.filter((item) => item.status === 'Izin').length },
      { id: 'Tanpa Keterangan', label: 'Tanpa keterangan', count: fullAttendance.filter((item) => item.status === 'Tanpa Keterangan').length }
    ].filter((item) => item.id === 'all' || item.count > 0);
  });

  const filteredDispositions = $derived(
    activeFilter === 'all'
      ? fullDispositions
      : fullDispositions.filter((item) => item.status === activeFilter)
  );
  const filteredTravel = $derived(
    activeFilter === 'all' ? fullTravel : fullTravel.filter((item) => item.kind === activeFilter)
  );
  const filteredAttendance = $derived(
    activeFilter === 'all'
      ? fullAttendance
      : fullAttendance.filter((item) => item.status === activeFilter)
  );

  const shownCount = $derived(
    activeList === 'dispositions'
      ? filteredDispositions.length
      : activeList === 'travel'
        ? filteredTravel.length
        : filteredAttendance.length
  );

  function selectTab(id: 'dispositions' | 'travel' | 'attendance') {
    activeList = id;
    activeFilter = 'all';
  }

  const note = $derived.by(() => {
    if (unit.disposition.pending > 0) {
      return {
        tone: 'danger',
        icon: 'alert',
        text: `${num(unit.disposition.pending)} disposisi belum selesai dan sudah melewati tenggat. Prioritaskan penelusuran bukti penyelesaian.`
      };
    }
    if (unit.attendance.total > 0 && unit.attendance.pct < summary.attendance.pct - 5) {
      return {
        tone: 'warn',
        icon: 'info',
        text: `Kehadiran ${pct(unit.attendance.pct)} berada di bawah rata-rata provinsi ${pct(summary.attendance.pct)}. Tinjau kembali keterangan pada catatan yang tidak hadir.`
      };
    }
    if (unit.attendance.pct >= 90) {
      return {
        tone: 'success',
        icon: 'check-circle',
        text: `Kehadiran ${pct(unit.attendance.pct)} termasuk tinggi, dan tidak ada disposisi yang tertunggak. Pertahankan konsistensi pencatatan.`
      };
    }
    return {
      tone: 'success',
      icon: 'check-circle',
      text: `Kehadiran ${pct(unit.attendance.pct)} dengan ${num(unit.disposition.pending)} disposisi belum selesai.`
    };
  });

  const toneClass = $derived(
    note.tone === 'danger' ? 'danger' : note.tone === 'success' ? 'success' : ''
  );

  function meetingTitle(record: AttendanceRecord): string {
    return dataset.meetings[record.m]?.title ?? 'Rapat';
  }

  function rankText(rank: number, of: number): string {
    return rank > 0 ? `${rank} dari ${of}` : '—';
  }

  let exporting = $state<'pdf' | 'xlsx' | null>(null);
  let exportError = $state('');

  async function exportPdf() {
    exporting = 'pdf';
    exportError = '';
    try {
      await downloadUnitPdf(unit, $dashboard.meta);
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
      await downloadUnitXlsx(unit, $dashboard.meta);
    } catch {
      exportError = 'Unduhan XLSX gagal. Muat ulang halaman lalu coba lagi.';
    } finally {
      exporting = null;
    }
  }
</script>

<svelte:head>
  <title>{unit.short} — Kinerja Kepala Perangkat Daerah 2026</title>
  <meta
    name="description"
    content={`Profil ${unit.short}: kehadiran rapat, penyelesaian disposisi, dan perjalanan dinas ${unit.head} periode ${periodLabel}.`}
  />
</svelte:head>

<div class="wrap">
  <nav class="breadcrumb" aria-label="Breadcrumb">
    <a href="/">Ringkasan</a>
    <span aria-hidden="true">/</span>
    <a href="/perangkat-daerah">Perangkat Daerah</a>
    <span aria-hidden="true">/</span>
    <span aria-current="page">{unit.short}</span>
  </nav>

  <section class="detail-hero">
    <div class="detail-identity">
      <span class="detail-avatar" aria-hidden="true">{unitInitials(unit.head)}</span>
      <div>
        <div class="page-head-meta" style="margin-top:0">
          <span class="chip primary">{unit.group}</span>
          <span class="chip">{periodLabel}</span>
        </div>
        <h1>{unit.short}</h1>
        <p class="full-name">{unit.name}</p>
        <div class="detail-head">
          <Icon name="users" size={15} />
          <span>Kepala:</span>
          <strong>{unit.head}</strong>
        </div>
      </div>
    </div>
    <div class="detail-actions">
      <a class="btn ghost small" href="/perangkat-daerah">
        <Icon name="chevron-left" size={15} /> Daftar unit
      </a>
      <button class="btn ghost small" type="button" onclick={exportPdf} disabled={exporting !== null}>
        <Icon name="download" size={15} /> {exporting === 'pdf' ? 'Menyiapkan…' : 'Unduh PDF'}
      </button>
      <button class="btn ghost small" type="button" onclick={exportXlsx} disabled={exporting !== null}>
        <Icon name="download" size={15} /> {exporting === 'xlsx' ? 'Menyiapkan…' : 'Unduh XLSX'}
      </button>
    </div>
  </section>

  {#if exportError}
    <div class="callout danger" role="alert" style="margin-top:0.8rem">
      <Icon name="alert" size={17} />
      <span>{exportError}</span>
    </div>
  {/if}

  <div class="range-shell">
    <DateRangeFilter />
  </div>

  <section class="detail-kpis" aria-label="Ringkasan indikator unit">
    <article class="detail-kpi">
      <div class="detail-kpi-label"><Icon name="users" size={14} /> Kehadiran rapat</div>
      <div class="detail-kpi-value">
        {pct(unit.attendance.pct)}
        <small>{num(unit.attendance.present)}/{num(unit.attendance.total)}</small>
      </div>
      <p class="detail-kpi-sub">
        Peringkat {rankText(unit.rank.attendance.rank, unit.rank.attendance.of)} · rata-rata provinsi
        {pct(summary.attendance.pct)}
      </p>
      <div class="metric-track" style="margin-top:0.65rem">
        <span style={`width:${unit.attendance.pct}%`}></span>
      </div>
    </article>

    <article class="detail-kpi">
      <div class="detail-kpi-label"><Icon name="mail" size={14} /> Penyelesaian disposisi</div>
      <div class="detail-kpi-value">
        {pct(unit.disposition.pct)}
        <small>
          {unit.disposition.total
            ? `${num(unit.disposition.done)}/${num(unit.disposition.total)}`
            : 'tidak ada'}
        </small>
      </div>
      <p class="detail-kpi-sub">
        {unit.disposition.total
          ? `${num(unit.disposition.pending)} belum selesai · peringkat ${rankText(unit.rank.disposition.rank, unit.rank.disposition.of)}`
          : 'Tidak ada disposisi tercatat untuk unit ini.'}
      </p>
      <div class="metric-track gold" style="margin-top:0.65rem">
        <span style={`width:${unit.disposition.pct ?? 0}%`}></span>
      </div>
    </article>

    <article class="detail-kpi">
      <div class="detail-kpi-label"><Icon name="plane" size={14} /> Perjalanan dinas</div>
      <div class="detail-kpi-value">
        {num(unit.travel.total)}
        <small>trip</small>
      </div>
      <p class="detail-kpi-sub">
        {num(unit.travel.days)} hari · {num(unit.travel.outside)} ke luar daerah
        ({pct(unit.travel.outsidePct)}) · rata-rata {decimal(unit.travel.avgDays)} hari
      </p>
      <div class="metric-track travel" style="margin-top:0.65rem">
        <span style={`width:${unit.travel.outsidePct}%`}></span>
      </div>
    </article>

    <article class="detail-kpi">
      <div class="detail-kpi-label"><Icon name="target" size={14} /> Nilai Reward &amp; Punishment</div>
      <div class="detail-kpi-value">
        {decimal(unit.reward)}
        <small>/ 30</small>
      </div>
      <p class="detail-kpi-sub">
        ({pct(unit.rewardAttendancePct)}{unit.attendance.total ? '' : '*'}
        + {pct(unit.rewardDispositionPct)}{unit.disposition.total ? '' : '*'}) ÷ 2 × 30% ·
        peringkat {rankText(unit.rank.reward.rank, unit.rank.reward.of)}
      </p>
      <div class="metric-track gold" style="margin-top:0.65rem">
        <span style={`width:${(unit.reward / 30) * 100}%`}></span>
      </div>
      {#if !unit.attendance.total || !unit.disposition.total}
        <p class="fineprint" style="margin-top:0.5rem">
          * Komponen tanpa catatan dianggap 100%.
        </p>
      {/if}
    </article>
  </section>

  <h2 class="sr-only">Rincian {unit.short}</h2>

  <div class="detail-grid">
    <div class="detail-stack">
      <section class="panel">
        <div class="panel-head">
          <div>
            <h3>Komposisi kehadiran</h3>
            <p>{num(unit.attendance.total)} catatan · {num(unit.attendance.present)} terhitung</p>
          </div>
          <span class="chip primary">{pct(unit.attendance.pct)} dari 4 status kehadiran</span>
        </div>
        <div class="panel-body">
          <div class="donut-wrap">
            <Donut
              segments={statusSegments}
              total={unit.attendance.total}
              centerValue={pct(unit.attendance.pct)}
              centerLabel="hadir"
              size={146}
            />
            <ul class="donut-legend">
              {#each statusSegments as segment}
                <li>
                  <span class="dot" style={`--dot:${segment.color}`}></span>
                  <span>{segment.label}</span>
                  <span class="value">
                    {num(segment.value)} · {pct((segment.value / unit.attendance.total) * 100)}
                  </span>
                </li>
              {/each}
            </ul>
          </div>
        </div>
      </section>

      <section class="panel">
        <div class="panel-head">
          <div>
            <h3>Tren bulanan unit</h3>
            <p>{periodLabel}</p>
          </div>
          <span class="chip">{unit.monthly.attendance.length} bulan</span>
        </div>
        <div class="panel-body">
          <div class="mini-trends">
            <div class="mini-trend">
              <div class="mini-trend-label">Kehadiran</div>
              <div class="mini-trend-value">{pct(unit.attendance.pct)}</div>
              <Sparkline values={attTrend} color="var(--primary)" label="Kehadiran bulanan" />
            </div>
            <div class="mini-trend">
              <div class="mini-trend-label">Surat disposisi</div>
              <div class="mini-trend-value">{num(unit.disposition.total)}</div>
              <Sparkline values={dispTrend} color="var(--primary)" label="Disposisi bulanan" />
            </div>
            <div class="mini-trend">
              <div class="mini-trend-label">Perjalanan</div>
              <div class="mini-trend-value">{num(unit.travel.total)}</div>
              <Sparkline values={travTrend} color="var(--travel)" label="Perjalanan bulanan" />
            </div>
          </div>
          <p class="fineprint" style="margin-top:0.7rem">
            Grafik menunjukkan jumlah catatan per bulan pada {periodLabel}.
          </p>
        </div>
      </section>

      <section class="panel">
        <div class="panel-head">
          <div>
            <h3>Tujuan perjalanan dinas</h3>
            <p>{num(unit.travel.total)} trip · {num(unit.travel.days)} hari</p>
          </div>
          <span class="chip travel">{pct(unit.travel.outsidePct)} luar daerah</span>
        </div>
        <div class="panel-body">
          <DestinationChart items={unit.destinations} total={unit.travel.total} limit={8} />
        </div>
      </section>

      <section class="panel">
        <div class="panel-head">
          <div>
            <h3>Daftar lengkap</h3>
            <p>Seluruh catatan unit pada {periodLabel}</p>
          </div>
          <div class="list-tabs" role="tablist" aria-label="Pilih daftar catatan">
            {#each tabs as tab}
              <button
                type="button"
                role="tab"
                aria-selected={activeList === tab.id}
                class:active={activeList === tab.id}
                onclick={() => selectTab(tab.id)}
              >{tab.label} ({tab.count})</button>
            {/each}
          </div>
        </div>
        <div class="panel-body">
          <div class="list-filters" role="group" aria-label="Filter daftar">
            {#each filterOptions as option}
              <button
                type="button"
                class:active={activeFilter === option.id}
                aria-pressed={activeFilter === option.id}
                onclick={() => (activeFilter = option.id)}
              >
                {option.label}<span>{option.count}</span>
              </button>
            {/each}
          </div>
          <p class="list-count" aria-live="polite">Menampilkan {shownCount} catatan</p>

          <div class="record-scroll">
            {#if activeList === 'dispositions'}
              {#each filteredDispositions as item, index}
                <article class="record-line">
                  <span class="record-line-no">{index + 1}</span>
                  <div class="record-line-main">
                    <div class="record-line-head">
                      <div class="record-line-title">{truncate(item.subject, 130)}</div>
                      <div class="record-line-side">
                        <span class:primary={item.status === 'Selesai'} class:danger={item.status !== 'Selesai'} class="chip">
                          {item.status}
                        </span>
                      </div>
                    </div>
                    <div class="record-line-meta">
                      {dateISO(item.d)} · {item.sender} · tenggat {dateISO(item.due)}
                    </div>
                  </div>
                </article>
              {:else}
                <div class="empty-state">
                  <strong>Tidak ada disposisi.</strong>
                  Tidak ada disposisi dengan filter ini.
                </div>
              {/each}
            {:else if activeList === 'travel'}
              {#each filteredTravel as item, index}
                <article class="record-line">
                  <span class="record-line-no">{index + 1}</span>
                  <div class="record-line-main">
                    <div class="record-line-head">
                      <div class="record-line-title">{titleCase(item.dest)}</div>
                      <div class="record-line-side">
                        <span class:travel={item.kind === 'Luar Daerah'} class="chip">{item.kind}</span>
                        <span class="chip">{item.days} hari</span>
                      </div>
                    </div>
                    <div class="record-line-meta">
                      {dateISO(item.d)}–{dateISO(item.end)} · {truncate(item.subject, 110)}
                    </div>
                  </div>
                </article>
              {:else}
                <div class="empty-state">
                  <strong>Tidak ada perjalanan.</strong>
                  Tidak ada perjalanan dengan filter ini.
                </div>
              {/each}
            {:else}
              {#each filteredAttendance as item, index}
                <article class="record-line">
                  <span class="record-line-no">{index + 1}</span>
                  <div class="record-line-main">
                    <div class="record-line-head">
                      <div class="record-line-title">{meetingTitle(item)}</div>
                      <div class="record-line-side">
                        <span
                          class:primary={item.status === 'Hadir'}
                          class:danger={item.status === 'Tanpa Keterangan'}
                          class:travel={item.status === 'Dinas Luar'}
                          class:gold={item.status === 'Diwakili'}
                          class="chip"
                        >{item.status}</span>
                      </div>
                    </div>
                    <div class="record-line-meta">{dateISO(item.d)}</div>
                  </div>
                </article>
              {:else}
                <div class="empty-state">
                  <strong>Tidak ada catatan kehadiran.</strong>
                  Tidak ada catatan dengan filter ini.
                </div>
              {/each}
            {/if}
          </div>
        </div>
      </section>
    </div>

    <aside class="detail-aside">
      <section class="panel">
        <div class="panel-head">
          <div><h3>Profil unit</h3></div>
        </div>
        <div class="panel-body">
          <dl class="profile-list">
            <div class="profile-row">
              <dt>Kelompok</dt>
              <dd>{unit.group}</dd>
            </div>
            <div class="profile-row">
              <dt>Kepala</dt>
              <dd>{unit.head}</dd>
            </div>
            <div class="profile-row">
              <dt>Peringkat hadir</dt>
              <dd>{rankText(unit.rank.attendance.rank, unit.rank.attendance.of)}</dd>
            </div>
            <div class="profile-row">
              <dt>Peringkat disposisi</dt>
              <dd>
                {unit.disposition.total
                  ? rankText(unit.rank.disposition.rank, unit.rank.disposition.of)
                  : 'Tidak ada data disposisi'}
              </dd>
            </div>
            <div class="profile-row">
              <dt>Peringkat perjalanan</dt>
              <dd>{rankText(unit.rank.travel.rank, unit.rank.travel.of)}</dd>
            </div>
            <div class="profile-row">
              <dt>Nilai R&amp;P</dt>
              <dd>{decimal(unit.reward)} / 30 · peringkat {unit.rank.reward.rank}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section class="panel">
        <div class="panel-head">
          <div>
            <h3>Catatan unit</h3>
            <p>Berdasarkan angka unit ini</p>
          </div>
        </div>
        <div class="panel-body">
          <div class={`callout ${toneClass}`}>
            <Icon name={note.icon} size={17} />
            <span>{note.text}</span>
          </div>
          <p class="fineprint" style="margin-top:0.7rem">
            Data per unit.
          </p>
          <a class="insight-link" href="/metodologi">
            Cara membaca data <Icon name="arrow-right" size={14} />
          </a>
        </div>
      </section>

      <section class="panel">
        <div class="panel-head">
          <div>
            <h3>Unit lain di {unit.group}</h3>
            <p>Bandingkan dalam kelompok yang sama</p>
          </div>
        </div>
        <div class="panel-body">
          <div class="unit-nav">
            {#each peers as peer}
              <a href={`/perangkat-daerah/${peer.id}`}>{peer.short}</a>
            {/each}
          </div>
        </div>
      </section>
    </aside>
  </div>
</div>

<style>
  .record-meta {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }
</style>
