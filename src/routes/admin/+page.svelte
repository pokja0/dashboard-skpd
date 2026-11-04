<script lang="ts">
  import type { ActionData, PageData } from './$types';
  import { page } from '$app/state';
  import { dataset } from '#lib/data';
  import { dateISO, num } from '#lib/format';
  import Icon from '#lib/components/Icon.svelte';

  let { data }: { data: PageData } = $props();
  const form = $derived(page.form as ActionData);
  const audit = dataset.audit;
  const duplicateCount = audit.duplicates.dispositions.length + audit.duplicates.travel.length;
  const headChanges = audit.headChanges;
  const issueCount =
    duplicateCount +
    audit.dateFixes.length +
    audit.missingNames.length +
    audit.excludedDispositions.count +
    headChanges.length;
  function joinRows(rows: number[]): string {
    if (rows.length <= 1) return rows.join('');
    return `${rows.slice(0, -1).join(', ')}, dan ${rows[rows.length - 1]}`;
  }

  const duplicateRows = joinRows(
    [...audit.duplicates.dispositions, ...audit.duplicates.travel]
      .map((item) => item.row)
      .sort((a, b) => a - b)
  );
  const dateRows = joinRows(audit.dateFixes.map((item) => item.row));
  const missingRows = joinRows(audit.missingNames.map((item) => item.row));
</script>

<svelte:head>
  <title>Superadmin — Dashboard Kinerja Perangkat Daerah</title>
</svelte:head>

<div class="wrap page-head">
  <span class="eyebrow">Superadmin</span>
  <h1>Administrasi akun dan kualitas data.</h1>
  <p class="lede">
    Buat akun pengguna, tinjau perbaikan data, dan buka data mentah dari spreadsheet.
  </p>
  <div class="page-head-meta">
    <span class="chip primary"><Icon name="shield" size={13} /> Superadmin</span>
    <span class="chip"><Icon name="users" size={13} /> {data.accounts.length} akun</span>
    <span class="chip"><Icon name="alert" size={13} /> {num(issueCount)} catatan perbaikan</span>
    <span class="chip"><Icon name="users" size={13} /> {num(headChanges.length)} kandidat pergantian kepala</span>
  </div>
</div>

<div class="wrap section-tight">
  <div class="stat-strip">
    <div>
      <span>Duplikat</span>
      <strong>{num(duplicateCount)}</strong>
    </div>
    <div>
      <span>Tanggal diperbaiki</span>
      <strong>{num(audit.dateFixes.length)}</strong>
    </div>
    <div>
      <span>Baris non-SKPD</span>
      <strong>{num(audit.excludedDispositions.count)}</strong>
    </div>
    <div>
      <span>Label unit mentah</span>
      <strong>{num(audit.rawLabelCount)} → {audit.unitCount}</strong>
    </div>
  </div>
</div>

<section class="wrap section-tight">
  <article class="panel">
    <div class="panel-head">
      <div>
        <h3>Perbaikan yang diperlukan</h3>
        <p>Tindakan pada sheet sumber agar rekap berikutnya bersih.</p>
      </div>
      <span class="chip danger"><Icon name="alert" size={13} /> {num(issueCount)} temuan</span>
    </div>
    <div class="panel-body">
      <ol class="fix-list">
        <li>
          <strong>Hapus baris duplikat</strong>
          <span>Baris {duplicateRows} perlu dihapus agar tidak dihitung ganda.</span>
        </li>
        <li>
          <strong>Perbaiki format tanggal</strong>
          <span>
            Baris {dateRows} memakai format yang tidak valid; ubah menjadi DD/MM/YYYY.
          </span>
        </li>
        <li>
          <strong>Lengkapi nama kepala</strong>
          <span>Baris {missingRows} belum mencantumkan nama pada kolom perjalanan dinas.</span>
        </li>
        <li>
          <strong>Pastikan tujuan disposisi adalah SKPD</strong>
          <span>
            {num(audit.excludedDispositions.count)} baris non-SKPD tidak dihitung ke total unit. Periksa
            kembali unit tujuan atau keluarkan dari rekap.
          </span>
        </li>
        <li>
          <strong>Verifikasi pergantian kepala</strong>
          <span>
            {num(headChanges.length)} unit memiliki lebih dari satu nama kepala pada data perjalanan.
            Periksa tanggal jabatan serta status Plt./definitif.
          </span>
        </li>
        <li>
          <strong>Seragamkan nama unit</strong>
          <span>
            {num(audit.rawLabelCount)} label mentah dipetakan menjadi {audit.unitCount} unit baku.
            Gunakan nama baku pada pengisian berikutnya.
          </span>
        </li>
      </ol>
    </div>
  </article>
</section>

<section class="wrap section-tight admin-grid">
  <article class="panel">
    <div class="panel-head">
      <div>
        <h3>Buat akun pengguna</h3>
        <p>Akun baru dapat mengakses menu Perangkat Daerah.</p>
      </div>
      <span class="chip primary">Role: pengguna</span>
    </div>
    <div class="panel-body">
      {#if form?.error}
        <div class="callout danger" role="alert">
          <Icon name="alert" size={17} />
          <span>{form.error}</span>
        </div>
      {/if}
      {#if form?.success}
        <div class="callout success" role="status">
          <Icon name="check-circle" size={17} />
          <span>{form.success}</span>
        </div>
      {/if}

      <form method="POST" action="?/create" class="admin-form">
        <label class="field">
          <span>Username</span>
          <input
            type="text"
            name="username"
            value={form?.username ?? ''}
            placeholder="contoh: operator.setda"
            autocomplete="off"
            required
          />
        </label>
        <label class="field">
          <span>Kata sandi awal</span>
          <input
            type="password"
            name="password"
            minlength="8"
            placeholder="Minimal 8 karakter"
            autocomplete="new-password"
            required
          />
        </label>
        <button class="btn primary" type="submit">
          <Icon name="users" size={15} /> Buat akun
        </button>
      </form>
    </div>
  </article>

  <article class="panel">
    <div class="panel-head">
      <div>
        <h3>Daftar akun</h3>
        <p>Akun yang dapat mengakses dashboard.</p>
      </div>
    </div>
    <div class="panel-body">
      <div class="account-list">
        {#each data.accounts as account}
          <div class="account-row">
            <span class="unit-avatar">{account.username.slice(0, 2).toUpperCase()}</span>
            <div>
              <strong>{account.username}</strong>
              <small>Dibuat {dateISO(account.createdAt.slice(0, 10))}</small>
            </div>
            <span class:primary={account.role === 'superadmin'} class="chip">
              {account.role === 'superadmin' ? 'Superadmin' : 'Pengguna'}
            </span>
          </div>
        {/each}
      </div>
    </div>
  </article>
</section>

<section class="wrap section-tight">
  <div class="section-head">
    <div>
      <span class="eyebrow">Kualitas data</span>
      <h2>Perbaikan yang dilakukan</h2>
      <p>Nomor baris mengikuti sheet sumber: baris 1 adalah header.</p>
    </div>
    <a class="btn ghost small" href="/admin/data">
      <Icon name="file" size={15} /> Data mentah
    </a>
  </div>

  <div class="admin-quality-grid">
    <article class="panel">
      <div class="panel-head">
        <div><h3>Duplikat</h3><p>{num(duplicateCount)} baris duplikat dibuang</p></div>
      </div>
      <div class="panel-body">
        <div class="audit-list">
          {#each audit.duplicates.dispositions as item}
            <div class="audit-item">
              <span class="chip danger">Disposisi</span>
              <strong>Baris {item.row}</strong>
              <p>{item.date} · {item.target}</p>
              <small>Duplikat dari baris {item.keptRow} · {item.subject}</small>
            </div>
          {/each}
          {#each audit.duplicates.travel as item}
            <div class="audit-item">
              <span class="chip travel">Perjalanan</span>
              <strong>Baris {item.row}</strong>
              <p>{item.date} · {item.name || 'Tanpa nama'} · {item.unit}</p>
              <small>Duplikat dari baris {item.keptRow} · {item.subject}</small>
            </div>
          {/each}
        </div>
      </div>
    </article>

    <article class="panel">
      <div class="panel-head">
        <div><h3>Perbaikan tanggal</h3><p>{num(audit.dateFixes.length)} sel tanggal diperbaiki</p></div>
      </div>
      <div class="panel-body">
        <div class="table-shell">
          <table class="data-table audit-table">
            <thead>
              <tr><th>Baris</th><th>Kolom</th><th>Asli</th><th>Diperbaiki</th></tr>
            </thead>
            <tbody>
              {#each audit.dateFixes as item}
                <tr>
                  <td>{item.row}</td>
                  <td>{item.column}</td>
                  <td class="audit-raw">{item.raw}</td>
                  <td class="audit-fixed">{item.fixed}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    </article>
  </div>

  <div class="admin-quality-grid" style="margin-top:0.9rem">
    <article class="panel">
      <div class="panel-head">
        <div><h3>Baris tanpa nama</h3><p>{num(audit.missingNames.length)} baris perjalanan</p></div>
      </div>
      <div class="panel-body">
        {#each audit.missingNames as item}
          <div class="audit-item">
            <strong>Baris {item.row}</strong>
            <p>{item.date} · {item.unit}</p>
            <small>{item.subject}</small>
          </div>
        {/each}
      </div>
    </article>

    <article class="panel">
      <div class="panel-head">
        <div><h3>Baris non-SKPD</h3><p>{num(audit.excludedDispositions.count)} baris tidak dihitung di total unit</p></div>
      </div>
      <div class="panel-body">
        <div class="audit-targets">
          {#each audit.excludedDispositions.byTarget as item}
            <div><span>{item.target}</span><strong>{num(item.count)}</strong></div>
          {/each}
        </div>
        <details class="audit-details">
          <summary>Lihat rincian baris non-SKPD</summary>
          <div class="table-shell">
            <table class="data-table audit-table">
              <thead><tr><th>Baris</th><th>Tanggal</th><th>Tujuan</th><th>Perihal</th></tr></thead>
              <tbody>
                {#each audit.excludedDispositions.rows as item}
                  <tr>
                    <td>{item.row}</td>
                    <td>{item.date}</td>
                    <td>{item.target}</td>
                    <td>{item.subject}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </details>
      </div>
    </article>
  </div>

  <article class="panel" style="margin-top:0.9rem">
    <div class="panel-head">
      <div>
        <h3>Kandidat pergantian kepala</h3>
        <p>Nama berbeda pada data perjalanan per unit.</p>
      </div>
      <span class="chip danger">Perlu verifikasi</span>
    </div>
    <div class="panel-body">
      <div class="audit-list">
        {#each headChanges as change}
          <div class="audit-item">
            <span
              class:primary={change.kind === 'variant'}
              class:danger={change.kind === 'change'}
              class="chip"
            >
              {change.kind === 'change' ? 'Pergantian' : 'Varian nama'}
            </span>
            <strong>{change.unitShort}</strong>
            {#each change.names as candidate}
              <p>
                {candidate.name} · {num(candidate.count)} baris ·
                {dateISO(candidate.first)}–{dateISO(candidate.last)}
              </p>
              <small>Baris: {candidate.rows.join(', ')}</small>
            {/each}
            <small>{change.note}</small>
          </div>
        {/each}
      </div>
    </div>
  </article>
</section>
