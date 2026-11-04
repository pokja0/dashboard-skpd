<script lang="ts">
  import type { PageData } from './$types';
  import Icon from '#lib/components/Icon.svelte';
  import { dataset } from '#lib/data';
  import { num } from '#lib/format';

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>Data Mentah — Superadmin</title>
</svelte:head>

<div class="wrap page-head">
  <span class="eyebrow">Superadmin</span>
  <h1>Data mentah.</h1>
  <p class="lede">
    Tampilan data sumber sebagaimana di spreadsheet. Nomor baris mengikuti sheet: baris 1 adalah header.
  </p>
  <div class="page-head-meta">
    <a class="btn ghost small" href="/admin"><Icon name="chevron-left" size={14} /> Kembali ke admin</a>
    <a class="btn ghost small" href="/admin/data/csv"><Icon name="file" size={14} /> Unduh CSV</a>
    {#if dataset.meta.sourceUrl}
      <a
        class="btn ghost small"
        href={dataset.meta.sourceUrl}
        target="_blank"
        rel="noreferrer"
      >
        <Icon name="external-link" size={14} /> Buka Google Sheet
      </a>
    {/if}
    <span class="chip">{num(data.total)} baris</span>
  </div>
</div>

<section class="wrap section-tight">
  <form class="toolbar raw-toolbar" method="GET" action="/admin/data">
    <div class="search-box">
      <Icon name="search" size={16} />
      <label class="sr-only" for="cari-data">Cari di seluruh kolom</label>
      <input id="cari-data" type="search" name="q" value={data.q} placeholder="Cari di seluruh kolom…" />
    </div>
    <div class="toolbar-group">
      <button class="btn primary small" type="submit">Cari</button>
      {#if data.q}
        <a class="btn ghost small" href="/admin/data">Reset</a>
      {/if}
    </div>
  </form>

  <div class="table-shell raw-table-shell">
    <div class="raw-table-wrap">
      <table class="data-table raw-table">
        <thead>
          <tr>
            <th class="raw-row-no">Baris</th>
            {#each data.header as column}
              <th>{column}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each data.rows as item}
            <tr>
              <td class="raw-row-no">{item.row}</td>
              {#each Array(data.columns) as _, index}
                <td title={item.cells[index] ?? ''}>{item.cells[index] ?? ''}</td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>

  <div class="table-foot">
    <span>
      Menampilkan {num(data.rows.length)} dari {num(data.total)} baris
      {#if data.q}· pencarian “{data.q}”{/if}
    </span>
    <div class="pagination">
      {#if data.page > 1}
        <a class="btn ghost small" href={`/admin/data?page=${data.page - 1}${data.q ? `&q=${encodeURIComponent(data.q)}` : ''}`}>
          Sebelumnya
        </a>
      {/if}
      <span>Halaman {data.page} / {data.totalPages}</span>
      {#if data.page < data.totalPages}
        <a class="btn ghost small" href={`/admin/data?page=${data.page + 1}${data.q ? `&q=${encodeURIComponent(data.q)}` : ''}`}>
          Berikutnya
        </a>
      {/if}
    </div>
  </div>
</section>
