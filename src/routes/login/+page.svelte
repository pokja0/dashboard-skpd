<script lang="ts">
  import type { ActionData, PageData } from './$types';
  import { page } from '$app/state';
  import Icon from '#lib/components/Icon.svelte';

  let { data }: { data: PageData } = $props();
  const form = $derived(page.form as ActionData);
</script>

<svelte:head>
  <title>Masuk — Dashboard Kinerja Perangkat Daerah</title>
</svelte:head>

<div class="wrap login-wrap">
  <section class="panel login-card">
    <div class="login-head">
      <span class="insight-icon"><Icon name="lock" size={20} /></span>
      <span class="eyebrow">Akses terbatas</span>
      <h1>Masuk ke Dashboard.</h1>
      <p>Menu Perangkat Daerah hanya dapat diakses dengan akun yang diberikan superadmin.</p>
    </div>

    {#if form?.error}
      <div class="callout danger" role="alert">
        <Icon name="alert" size={17} />
        <span>{form.error}</span>
      </div>
    {/if}

    <form method="POST" action="?/login" class="login-form">
      <input type="hidden" name="redirect" value={data.redirectTo} />
      <label class="field">
        <span>Username</span>
        <input
          type="text"
          name="username"
          value={form?.username ?? ''}
          autocomplete="username"
          required
        />
      </label>
      <label class="field">
        <span>Kata sandi</span>
        <input
          type="password"
          name="password"
          autocomplete="current-password"
          minlength="8"
          required
        />
      </label>
      <button class="btn primary login-submit" type="submit">
        Masuk <Icon name="arrow-right" size={16} />
      </button>
    </form>

    <p class="fineprint login-help">
      Belum punya akun? Hubungi superadmin untuk pembuatan akun.
    </p>
  </section>
</div>
