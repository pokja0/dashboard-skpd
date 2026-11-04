<script lang="ts">
  import { availableLabel, buildDashboard, fullRange } from '#lib/dashboard';
  import { num, dateISO } from '#lib/format';

  const data = buildDashboard(fullRange.from, fullRange.to);
</script>

<svelte:head>
  <title>Metodologi — Dashboard Kinerja Perangkat Daerah 2026</title>
  <meta
    name="description"
    content="Sumber data, definisi indikator, dan periode dashboard rekap kepala Perangkat Daerah Sulawesi Barat 2026."
  />
</svelte:head>

<div class="wrap page-head">
  <span class="eyebrow">Metodologi</span>
  <h1>Definisi dan periode data.</h1>
  <p class="lede">
    Dashboard ini memakai empat indikator: kehadiran rapat, penyelesaian disposisi, perjalanan
    dinas, dan nilai reward &amp; punishment.
  </p>
  <div class="page-head-meta">
    <span class="chip">Diperbarui {dateISO(data.meta.generatedAt)}</span>
    <span class="chip">41 unit</span>
  </div>
</div>

<div class="wrap wrap-narrow prose">
  <div class="stat-strip" style="margin-top:0.4rem">
    <div>
      <span>Catatan kehadiran</span>
      <strong>{num(data.summary.attendance.total)}</strong>
    </div>
    <div>
      <span>Surat disposisi</span>
      <strong>{num(data.summary.disposition.total)}</strong>
    </div>
    <div>
      <span>Perjalanan</span>
      <strong>{num(data.summary.travel.total)}</strong>
    </div>
    <div>
      <span>Rapat unik</span>
      <strong>{num(data.summary.attendance.meetings)}</strong>
    </div>
  </div>

  <h2>Sumber dan periode</h2>
  <p>
    Sumber data: <strong>Rekap Tim Staf Sekda</strong>. Periode data:
    <strong>{data.meta.periodLabel}</strong>.
  </p>
  <p>
    Data tersedia dari <strong>{availableLabel}</strong>. Ringkasan memakai seluruh periode data.
    Halaman Daftar dan Detail memakai periode penilaian bulanan; default-nya bulan lengkap terakhir
    yang memiliki data kehadiran. Tombol <strong>Bulan berjalan</strong> memilih bulan terakhir yang
    tersedia pada data.
  </p>

  <h2>Indikator</h2>
  <div class="method-grid">
    <article class="method-card">
      <h3>Kehadiran rapat</h3>
      <p>
        Jumlah catatan kehadiran kepala unit pada rapat. Status yang dihitung sebagai kehadiran
        adalah Hadir, Diwakili, Dinas Luar, dan Sakit. Persentase = jumlah keempat status ÷ total
        catatan unit. Rincian Izin dan Tanpa Keterangan tetap ditampilkan.
      </p>
    </article>
    <article class="method-card">
      <h3>Penyelesaian disposisi</h3>
      <p>
        Jumlah surat disposisi yang ditujukan ke unit. Persentase = status Selesai ÷ total surat
        unit.
      </p>
    </article>
    <article class="method-card">
      <h3>Perjalanan dinas</h3>
      <p>
        Jumlah kegiatan perjalanan dinas per unit, lama hari, serta jenis dalam daerah atau luar
        daerah.
      </p>
    </article>
    <article class="method-card">
      <h3>Nilai Reward &amp; Punishment</h3>
      <p>
        Nilai = ((persentase kehadiran + persentase disposisi) ÷ 2) × 30%. Skala nilai 0–30.
        Komponen yang tidak memiliki catatan kehadiran atau disposisi dianggap 100% agar nilai
        tetap dapat dihitung.
      </p>
    </article>
    <article class="method-card">
      <h3>Peringkat</h3>
      <p>Peringkat dibuat terpisah untuk setiap kategori, termasuk Nilai R&amp;P.</p>
    </article>
  </div>

  <h2>Catatan</h2>
  <ul>
    <li>Perhitungan dilakukan per unit, bukan per individu.</li>
    <li>Kehadiran, disposisi, dan perjalanan dihitung sendiri-sendiri.</li>
    <li>Kehadiran mencakup status Hadir, Diwakili, Dinas Luar, dan Sakit; komposisi lengkap tetap terlihat pada detail unit.</li>
    <li>Komponen kehadiran atau disposisi yang tidak memiliki catatan dianggap 100% pada Nilai R&amp;P.</li>
    <li>Nilai R&amp;P pada dashboard masih dihitung pada level unit. Penilaian individual memerlukan data masa jabatan kepala yang terverifikasi.</li>
    <li>Nama unit telah dinormalisasi menjadi 41 unit; duplikat dan tanggal tidak konsisten diperbaiki.</li>
    <li>Unit dengan catatan sedikit dapat memiliki persentase yang ekstrem.</li>
    <li>Pada periode ini: {num(data.summary.travel.total)} perjalanan dan {num(data.summary.disposition.pending)} disposisi belum selesai.</li>
  </ul>
</div>
