<script lang="ts">
  import { page } from '$app/state';
  import { statusColors, statusOrder, type DashboardUnit } from '#lib/data';
  import { buildDashboard, fullRange } from '#lib/dashboard';
  import { num, pct, decimal, dateISO, truncate } from '#lib/format';
  import Icon from '#lib/components/Icon.svelte';
  import KpiCard from '#lib/components/KpiCard.svelte';
  import MonthlyChart from '#lib/components/MonthlyChart.svelte';
  import Donut from '#lib/components/Donut.svelte';
  import StackedBar from '#lib/components/StackedBar.svelte';
  import DestinationChart from '#lib/components/DestinationChart.svelte';

  type Category = 'attendance' | 'disposition' | 'travel' | 'reward';

  const data = buildDashboard(fullRange.from, fullRange.to);
  const meta = data.meta;
  const summary = data.summary;
  const insights = data.insights;
  const units = data.units;
  const user = $derived(page.data.user);

  let activeCategory = $state<Category>('attendance');

  const categories: Array<{ id: Category; label: string }> = [
    { id: 'attendance', label: 'Kehadiran' },
    { id: 'disposition', label: 'Disposisi' },
    { id: 'travel', label: 'Perjalanan' },
    { id: 'reward', label: 'Nilai R&P' }
  ];

  const statusSegments = $derived(
    statusOrder.map((status) => ({
      label: status,
      value: summary.attendance.statuses[status],
      color: statusColors[status]
    }))
  );

  const travelSegments = $derived([
    { label: 'Dalam daerah', value: summary.travel.inside, color: 'var(--travel)' },
    { label: 'Luar daerah', value: summary.travel.outside, color: 'var(--primary)' }
  ]);

  const attPoints = $derived(data.monthly.attendance);
  const dispPoints = $derived(data.monthly.disposition);
  const travPoints = $derived(data.monthly.travel);
  const labels = $derived(
    attPoints.map((point) => meta.monthLabels[meta.months.indexOf(String(point.month))] ?? '')
  );

  function sumBy(points: Array<Record<string, number | string | undefined>>, key: string): number {
    return points.reduce((sum, point) => sum + (Number(point[key]) || 0), 0);
  }

  function peak(points: Array<Record<string, number | string | undefined>>, key: string): string {
    let best = -1;
    let bestValue = -1;
    points.forEach((point, index) => {
      const value = Number(point[key]) || 0;
      if (value > bestValue) {
        bestValue = value;
        best = index;
      }
    });
    if (best < 0 || bestValue <= 0) return '—';
    return `${labels[best]} (${num(bestValue)})`;
  }

  const attTotal = $derived(sumBy(attPoints, 'meetings'));
  const dispTotal = $derived(sumBy(dispPoints, 'total'));
  const travTotal = $derived(sumBy(travPoints, 'total'));

  const maxTravel = $derived(Math.max(1, ...units.map((unit) => unit.travel.total)));
  const maxPending = $derived(Math.max(1, ...insights.pendingTop.map((unit) => unit.pending)));

  function metricValue(unit: DashboardUnit): number {
    if (activeCategory === 'attendance') return unit.attendance.pct;
    if (activeCategory === 'disposition') return unit.disposition.pct ?? -1;
    if (activeCategory === 'reward') return unit.reward;
    return unit.travel.total;
  }

  const ranking = $derived(
    [...units].sort((a, b) => metricValue(b) - metricValue(a)).slice(0, 7)
  );

  function barWidth(unit: DashboardUnit): number {
    if (activeCategory === 'attendance') return unit.attendance.pct;
    if (activeCategory === 'disposition') return unit.disposition.pct ?? 0;
    if (activeCategory === 'reward') return (unit.reward / 30) * 100;
    return (unit.travel.total / maxTravel) * 100;
  }

  function metricLine(unit: DashboardUnit): string {
    if (activeCategory === 'attendance') {
      return `${num(unit.attendance.present)} dari ${num(unit.attendance.total)} catatan`;
    }
    if (activeCategory === 'disposition') {
      return unit.disposition.total
        ? `${num(unit.disposition.done)} dari ${num(unit.disposition.total)} surat`
        : 'Tidak ada disposisi';
    }
    if (activeCategory === 'reward') {
      const att = unit.attendance.total ? pct(unit.attendance.pct) : '100%*';
      const disp = unit.disposition.total ? pct(unit.disposition.pct) : '100%*';
      return `Kehadiran ${att} · Disposisi ${disp}`;
    }
    return `${num(unit.travel.inside)} dalam · ${num(unit.travel.outside)} luar`;
  }

  function metricDisplay(unit: DashboardUnit): string {
    if (activeCategory === 'attendance') return pct(unit.attendance.pct);
    if (activeCategory === 'disposition') return pct(unit.disposition.pct);
    if (activeCategory === 'reward') return decimal(unit.reward);
    return num(unit.travel.total);
  }

  function metricSmall(unit: DashboardUnit): string {
    if (activeCategory === 'attendance') return `Peringkat ${unit.rank.attendance.rank}`;
    if (activeCategory === 'disposition') {
      return unit.disposition.total ? `Peringkat ${unit.rank.disposition.rank}` : 'Tanpa data';
    }
    if (activeCategory === 'reward') return '/ 30';
    return `${num(unit.travel.days)} hari`;
  }

  const topDestinations = $derived(data.destinations);
</script>

<svelte:head>
  <title>Ringkasan Kinerja Kepala Perangkat Daerah 2026 — Pemprov Sulawesi Barat</title>
  <meta
    name="description"
    content={`Ringkasan eksekutif kehadiran rapat, penyelesaian disposisi, dan perjalanan dinas 41 Perangkat Daerah Provinsi Sulawesi Barat, ${meta.periodLabel}.`}
  />
</svelte:head>

<section class="wrap hero">
  <div class="hero-copy">
    <span class="eyebrow">Ringkasan eksekutif</span>
    <h1>Rekap Kinerja Kepala Perangkat Daerah 2026.</h1>
    <p class="hero-lede">
      Kehadiran rapat, penyelesaian disposisi, dan perjalanan dinas 41 Perangkat Daerah
      Provinsi Sulawesi Barat, {meta.periodLabel}.
    </p>
    <div class="hero-actions">
      {#if user}
        <a class="btn primary" href="/perangkat-daerah">
          Lihat Perangkat Daerah <Icon name="arrow-right" size={17} />
        </a>
      {:else}
        <a class="btn primary" href="/login?redirect=/perangkat-daerah">
          <Icon name="lock" size={16} /> Masuk untuk rincian
        </a>
      {/if}
      <a class="btn ghost" href="/metodologi">Cara membaca data</a>
    </div>
    <div class="hero-meta">
      <span><Icon name="calendar" size={14} /> {meta.periodLabel}</span>
      <span><Icon name="users" size={14} /> 41 unit</span>
      <span><Icon name="info" size={14} /> Ringkasan tahunan</span>
    </div>
  </div>

  <aside class="brief-card" aria-labelledby="brief-title">
    <div class="brief-top">
      <span class="brief-kicker">Ringkasan data</span>
      <span class="chip gold">2026</span>
    </div>
    <h2 id="brief-title">Angka utama.</h2>
    <dl class="brief-stats">
      <div class="brief-stat">
        <dt>Kehadiran rapat</dt>
        <dd>{pct(summary.attendance.pct)}</dd>
      </div>
      <div class="brief-stat">
        <dt>Disposisi selesai</dt>
        <dd>{num(summary.disposition.done)} / {num(summary.disposition.total)}</dd>
      </div>
      <div class="brief-stat">
        <dt>Belum selesai</dt>
        <dd>{num(summary.disposition.pending)} surat</dd>
      </div>
      <div class="brief-stat">
        <dt>Perjalanan dinas</dt>
        <dd>{num(summary.travel.total)} · {num(summary.travel.days)} hari</dd>
      </div>
    </dl>
    <p class="brief-foot">
      Sumber: Rekap Tim Staf Sekda. Diperbarui {dateISO(meta.generatedAt)}.
    </p>
  </aside>
</section>

<section class="wrap section-tight" aria-labelledby="kpi-title">
  <div class="section-head">
    <div>
      <span class="eyebrow">Sekilas</span>
      <h2 id="kpi-title">Tiga ukuran utama</h2>
    </div>
    <span class="section-note">{meta.periodLabel}</span>
  </div>

  <div class="kpi-grid">
    <KpiCard
      icon="users"
      label="Kehadiran rapat"
      value={decimal(summary.attendance.pct)}
      suffix="%"
      detail={`${num(summary.attendance.present)} dari ${num(summary.attendance.total)} catatan (Hadir, Diwakili, Dinas Luar, Sakit).`}
      meter={summary.attendance.pct}
      chips={[
        { text: `${num(summary.attendance.meetings)} rapat`, tone: 'primary' },
        { text: `${num(summary.attendance.statuses['Tanpa Keterangan'])} tanpa keterangan`, tone: 'danger' }
      ]}
    />
    <KpiCard
      icon="mail"
      label="Penyelesaian disposisi"
      value={decimal(summary.disposition.pct)}
      suffix="%"
      detail={`${num(summary.disposition.done)} dari ${num(summary.disposition.total)} surat selesai.`}
      meter={summary.disposition.pct}
      meterTone="gold"
      chips={[
        { text: `${num(summary.disposition.pending)} lewat tenggat`, tone: 'danger' },
        { text: `${summary.disposition.units} unit terlibat` }
      ]}
    />
    <KpiCard
      icon="plane"
      label="Perjalanan dinas"
      value={num(summary.travel.total)}
      suffix="trip"
      detail={`${num(summary.travel.days)} hari · rata-rata ${decimal(summary.travel.avgDays)} hari per trip.`}
      chips={[
        { text: `${pct(summary.travel.outsidePct)} luar daerah`, tone: 'travel' },
        { text: `${num(summary.travel.inside)} dalam daerah` }
      ]}
    />
  </div>
</section>

<section class="wrap section" aria-labelledby="highlight-title">
  <div class="section-head">
    <div>
      <span class="eyebrow">Perhatian</span>
      <h2 id="highlight-title">Tiga hal yang perlu diperhatikan</h2>
      <p>Disposisi tertunggak, kehadiran tanpa keterangan, dan perjalanan luar daerah.</p>
    </div>
    {#if user}
      <a class="btn ghost small" href="/perangkat-daerah">Lihat semua unit</a>
    {:else}
      <a class="btn ghost small" href="/login?redirect=/perangkat-daerah">
        <Icon name="lock" size={14} /> Masuk untuk melihat unit
      </a>
    {/if}
  </div>

  <div class="insight-grid">
    <article class="insight-card alert">
      <span class="insight-icon"><Icon name="alert" size={19} /></span>
      <h3>Disposisi belum selesai: {num(summary.disposition.pending)}</h3>
      <p>
        Seluruhnya sudah melewati tenggat. {insights.pendingTop[0]?.short ?? '—'}
        ({num(insights.pendingTop[0]?.pending ?? 0)}) dan
        {insights.pendingTop[1]?.short ?? '—'} ({num(insights.pendingTop[1]?.pending ?? 0)})
        menyumbang porsi terbesar.
      </p>
      <a class="insight-link" href="/perangkat-daerah">
        Lihat unit dengan tunggakan <Icon name="arrow-right" size={14} />
      </a>
    </article>

    <article class="insight-card warn">
      <span class="insight-icon"><Icon name="info" size={19} /></span>
      <h3>Catatan tanpa keterangan: {num(summary.attendance.statuses['Tanpa Keterangan'])}</h3>
      <p>
        Setara {pct((summary.attendance.statuses['Tanpa Keterangan'] / summary.attendance.total) * 100)} dari
        seluruh catatan. Kehadiran terendah: {insights.lowAttendance[0]?.short ?? '—'}
        ({pct(insights.lowAttendance[0]?.pct ?? 0)}).
      </p>
      <a class="insight-link" href="/perangkat-daerah">
        Lihat kehadiran per unit <Icon name="arrow-right" size={14} />
      </a>
    </article>

    <article class="insight-card neutral">
      <span class="insight-icon"><Icon name="plane" size={19} /></span>
      <h3>Perjalanan ke luar daerah: {num(summary.travel.outside)}</h3>
      <p>
        {pct(summary.travel.outsidePct)} dari {num(summary.travel.total)} perjalanan, dengan total
        {num(summary.travel.days)} hari.
      </p>
      <a class="insight-link" href="/perangkat-daerah">
        Lihat detail perjalanan <Icon name="arrow-right" size={14} />
      </a>
    </article>
  </div>
</section>

<section class="wrap section" aria-labelledby="trend-title">
  <div class="section-head">
    <div>
      <span class="eyebrow">Bulanan</span>
      <h2 id="trend-title">Tren bulanan</h2>
      <p>Jumlah catatan per bulan, {meta.periodLabel}.</p>
    </div>
    <span class="section-note">{meta.periodLabel}</span>
  </div>

  <div class="chart-grid">
    <article class="chart-card">
      <div class="chart-top">
        <div>
          <div class="chart-title">Rapat diikuti</div>
          <div class="chart-sub">Sesi unik per bulan</div>
        </div>
        <div class="chart-total">{num(attTotal)}<span>rapat</span></div>
      </div>
      <div class="chart-body">
        <MonthlyChart
          points={attPoints}
          labels={labels}
          series={[{ key: 'meetings', label: 'Rapat', color: 'var(--primary)' }]}
          note={`Puncak: ${peak(attPoints, 'meetings')}.`}
          ariaLabel={`Jumlah sesi rapat per bulan pada ${meta.periodLabel}`}
        />
      </div>
    </article>

    <article class="chart-card">
      <div class="chart-top">
        <div>
          <div class="chart-title">Surat disposisi</div>
          <div class="chart-sub">Selesai dan belum selesai</div>
        </div>
        <div class="chart-total">{num(dispTotal)}<span>surat</span></div>
      </div>
      <div class="chart-body">
        <MonthlyChart
          points={dispPoints}
          labels={labels}
          series={[
            { key: 'done', label: 'Selesai', color: 'var(--primary)' },
            { key: 'pending', label: 'Belum', color: 'var(--danger)' }
          ]}
          note={`Puncak: ${peak(dispPoints, 'total')}.`}
          ariaLabel={`Jumlah surat disposisi per bulan pada ${meta.periodLabel}`}
        />
      </div>
    </article>

    <article class="chart-card">
      <div class="chart-top">
        <div>
          <div class="chart-title">Perjalanan dinas</div>
          <div class="chart-sub">Dalam dan luar daerah</div>
        </div>
        <div class="chart-total">{num(travTotal)}<span>trip</span></div>
      </div>
      <div class="chart-body">
        <MonthlyChart
          points={travPoints}
          labels={labels}
          series={[
            { key: 'inside', label: 'Dalam daerah', color: 'var(--travel)' },
            { key: 'outside', label: 'Luar daerah', color: 'var(--primary)' }
          ]}
          note={`Puncak: ${peak(travPoints, 'total')}.`}
          ariaLabel={`Jumlah perjalanan dinas per bulan pada ${meta.periodLabel}`}
        />
      </div>
    </article>
  </div>
</section>

<section class="wrap section" aria-labelledby="destination-title">
  <div class="section-head">
    <div>
      <span class="eyebrow">Perjalanan</span>
      <h2 id="destination-title">Tujuan perjalanan dinas</h2>
      <p>Jumlah perjalanan menurut tujuan pada {meta.periodLabel}.</p>
    </div>
    <span class="section-note">{meta.periodLabel}</span>
  </div>

  <div class="destination-grid">
    <article class="panel">
      <div class="panel-head">
        <div>
          <h3>Tujuan terbanyak</h3>
          <p>{num(summary.travel.total)} perjalanan</p>
        </div>
        <span class="chip travel">{pct(summary.travel.outsidePct)} luar daerah</span>
      </div>
      <div class="panel-body">
        <DestinationChart items={topDestinations} total={summary.travel.total} limit={8} />
      </div>
    </article>

    <article class="panel">
      <div class="panel-head">
        <div>
          <h3>Komposisi perjalanan</h3>
          <p>{num(summary.travel.days)} hari · rata-rata {decimal(summary.travel.avgDays)} hari per trip</p>
        </div>
      </div>
      <div class="panel-body">
        <div class="donut-wrap">
          <Donut
            segments={travelSegments}
            total={summary.travel.total}
            centerValue={num(summary.travel.total)}
            centerLabel="trip"
            size={132}
          />
          <ul class="donut-legend">
            {#each travelSegments as segment}
              <li>
                <span class="dot" style={`--dot:${segment.color}`}></span>
                <span>{segment.label}</span>
                <span class="value">{num(segment.value)} · {pct(summary.travel.total ? (segment.value / summary.travel.total) * 100 : 0)}</span>
              </li>
            {/each}
          </ul>
        </div>
        <div class="divider"></div>
        <dl class="destination-stats">
          <div><dt>Total perjalanan</dt><dd>{num(summary.travel.total)}</dd></div>
          <div><dt>Dalam daerah</dt><dd>{num(summary.travel.inside)}</dd></div>
          <div><dt>Luar daerah</dt><dd>{num(summary.travel.outside)}</dd></div>
          <div><dt>Total hari</dt><dd>{num(summary.travel.days)}</dd></div>
        </dl>
      </div>
    </article>
  </div>
</section>

<section class="wrap section" aria-labelledby="attention-title">
  <div class="section-head">
    <div>
      <span class="eyebrow">Tindak lanjut</span>
      <h2 id="attention-title">Yang perlu ditindaklanjuti</h2>
      <p>Disposisi tertunggak dan komposisi kehadiran pada {meta.periodLabel}.</p>
    </div>
    <span class="section-note">{meta.periodLabel}</span>
  </div>

  <div class="attention-grid two">
    <article class="panel attention-panel">
      <div class="panel-head">
        <div>
          <h3>Disposisi belum selesai</h3>
          <p>{num(summary.disposition.pending)} surat · {summary.disposition.pendingUnits} unit</p>
        </div>
        <span class="chip danger">Lewat tenggat</span>
      </div>
      <div class="panel-body">
        <ol class="rank-list">
          {#each insights.pendingTop.slice(0, 5) as item, index}
            <li class="rank-row">
              <span class:top={index === 0} class="rank-index">{index + 1}</span>
              <div class="rank-main">
                <div class="rank-name">{item.short}</div>
                <div class="rank-sub">{num(item.total)} surat · {pct(item.pct)} selesai</div>
                <div class="rank-bar"><span style={`width:${(item.pending / maxPending) * 100}%`}></span></div>
              </div>
              <div class="rank-value">{num(item.pending)}<small>belum</small></div>
            </li>
          {/each}
        </ol>
        <a class="insight-link" href="/perangkat-daerah">
          Lihat seluruh unit <Icon name="arrow-right" size={14} />
        </a>
      </div>
    </article>

    <article class="panel attention-panel">
      <div class="panel-head">
        <div>
          <h3>Komposisi kehadiran</h3>
          <p>{num(summary.attendance.total)} catatan · {num(summary.attendance.meetings)} rapat</p>
        </div>
        <span class="chip primary">{pct(summary.attendance.pct)} dari 4 status kehadiran</span>
      </div>
      <div class="panel-body">
        <StackedBar
          segments={statusSegments}
          total={summary.attendance.total}
          height={16}
          ariaLabel="Komposisi status kehadiran rapat"
        />
        <ul class="status-legend">
          {#each statusSegments as segment}
            <li>
              <span class="dot" style={`--dot:${segment.color}`}></span>
              <span>{segment.label}</span>
              <span class="count">{num(segment.value)} · {pct((segment.value / summary.attendance.total) * 100)}</span>
            </li>
          {/each}
        </ul>
        <div class="callout" style="margin-top:0.9rem">
          <Icon name="info" size={16} />
          <span>
            {num(summary.attendance.statuses['Tanpa Keterangan'])} catatan tanpa keterangan perlu
            klarifikasi unit. Kehadiran terendah: {insights.lowAttendance[0]?.short ?? '—'}
            ({pct(insights.lowAttendance[0]?.pct ?? 0)}).
          </span>
        </div>
      </div>
    </article>
  </div>
</section>

<section class="wrap section" aria-labelledby="ranking-title">
  <div class="section-head">
    <div>
      <span class="eyebrow">Perbandingan</span>
      <h2 id="ranking-title">Peringkat Perangkat Daerah</h2>
      <p>Peringkat per kategori.</p>
    </div>
    {#if user}
      <a class="btn ghost small" href="/perangkat-daerah">
        Semua {units.length} unit <Icon name="arrow-right" size={15} />
      </a>
    {:else}
      <a class="btn ghost small" href="/login?redirect=/perangkat-daerah">
        <Icon name="lock" size={14} /> Masuk
      </a>
    {/if}
  </div>

  {#if user}
  <div class="ranking-panel">
    <div class="ranking-toolbar">
      <div class="segmented" role="tablist" aria-label="Pilih kategori peringkat">
        {#each categories as category}
          <button
            type="button"
            role="tab"
            aria-selected={activeCategory === category.id}
            class:active={activeCategory === category.id}
            onclick={() => (activeCategory = category.id)}
          >{category.label}</button>
        {/each}
      </div>
      <span class="fineprint">7 teratas · klik unit untuk detail</span>
    </div>

    {#if activeCategory === 'reward'}
      <p class="fineprint" style="margin:0 0 0.6rem">
        Nilai R&amp;P = ((persentase kehadiran + persentase disposisi) ÷ 2) × 30%. Komponen
        tanpa catatan dianggap 100%. Peringkat ini memakai seluruh periode; penilaian bulanan
        tersedia di Daftar Perangkat Daerah.
      </p>
    {/if}

    <div class="ranking-list" role="tabpanel">
      {#each ranking as unit, index}
        <a class="ranking-row" href={`/perangkat-daerah/${unit.id}`}>
          <span class:top={index === 0} class="rank-index">{index + 1}</span>
          <div class="ranking-unit">
            <strong>{unit.short}</strong>
            <span>{truncate(unit.head, 44)}</span>
          </div>
          <div class="ranking-metric">
            <div class="metric-line">
              <span>{metricLine(unit)}</span>
            </div>
            <div class="metric-track"><span style={`width:${barWidth(unit)}%`}></span></div>
          </div>
          <div class="ranking-value">
            <strong>{metricDisplay(unit)}</strong>
            <span>{metricSmall(unit)}</span>
          </div>
        </a>
      {/each}
    </div>
  </div>
  {:else}
    <div class="locked-panel">
      <span class="insight-icon"><Icon name="lock" size={20} /></span>
      <div>
        <h3>Peringkat hanya untuk pengguna yang masuk</h3>
        <p>Masuk untuk melihat peringkat per kategori dan membuka detail setiap unit.</p>
      </div>
      <a class="btn primary small" href="/login?redirect=/perangkat-daerah">Masuk</a>
    </div>
  {/if}
</section>

<section class="wrap section">
  <div class="cta-panel">
    <div>
      <span class="eyebrow gold">Rincian lengkap</span>
      <h2>Lihat rincian 41 Perangkat Daerah.</h2>
      <p>
        Cari unit, bandingkan kategori, dan buka profil untuk rincian. Daftar memakai periode
        penilaian bulanan secara default.
      </p>
    </div>
    {#if user}
      <a class="btn primary" href="/perangkat-daerah">
        Buka daftar Perangkat Daerah <Icon name="arrow-up-right" size={16} />
      </a>
    {:else}
      <a class="btn primary" href="/login?redirect=/perangkat-daerah">
        <Icon name="lock" size={16} /> Masuk untuk rincian
      </a>
    {/if}
  </div>
</section>
