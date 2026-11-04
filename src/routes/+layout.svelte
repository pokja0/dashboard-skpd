<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import type { Snippet } from 'svelte';
  import { page } from '$app/state';
  import Icon from '#lib/components/Icon.svelte';
  import type { LayoutData } from './$types';

  let { data, children }: { data: LayoutData; children: Snippet } = $props();

  const user = $derived(data.user);

  let theme = $state<'light' | 'dark'>('light');

  onMount(() => {
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    theme = stored === 'dark' || stored === 'light' ? stored : prefersDark ? 'dark' : 'light';
    document.documentElement.dataset.theme = theme;
  });

  function toggleTheme() {
    theme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  }

  const path = $derived(page.url.pathname);

  const navItems = [
    { href: '/', label: 'Ringkasan', icon: 'chart' },
    { href: '/perangkat-daerah', label: 'Perangkat Daerah', short: 'Perangkat', icon: 'building' },
    { href: '/metodologi', label: 'Metodologi', icon: 'file' }
  ];

  function isActive(href: string): boolean {
    return href === '/' ? path === '/' : path.startsWith(href);
  }
</script>

<a class="skip-link" href="#main">Lewati ke konten utama</a>

<header class="site-header">
  <div class="wrap header-inner">
    <div class="brand-group">
      <a
        class="brand"
        href="/"
        aria-label="Pemerintah Provinsi Sulawesi Barat"
        title="Pemerintah Provinsi Sulawesi Barat"
      >
        <img
          class="brand-logo"
          src="/logo-sulbar.svg"
          alt="Lambang Provinsi Sulawesi Barat"
          width="44"
          height="44"
        />
      </a>
      <a
        class="vision-mark"
        href="/"
        title="Visi Pemprov Sulawesi Barat: Maju & Sejahtera"
        aria-label="Visi Pemprov Sulawesi Barat: Maju dan Sejahtera"
      >
        <img
          src="/logo-maju-sejahtera.svg"
          alt="Maju & Sejahtera"
          width="128"
          height="42"
        />
      </a>
    </div>

    <nav class="desktop-nav" aria-label="Navigasi utama">
      {#each navItems as item}
        <a href={item.href} class:active={isActive(item.href)} aria-current={isActive(item.href) ? 'page' : undefined}>
          {item.label}
        </a>
      {/each}
      {#if user?.role === 'superadmin'}
        <a href="/admin" class:active={isActive('/admin')} aria-current={isActive('/admin') ? 'page' : undefined}>
          Admin
        </a>
      {/if}
    </nav>

    <div class="header-tools">
      <span class="header-chip">Data 2026</span>
      {#if user}
        <span class="header-user" title={`Masuk sebagai ${user.username}`}>
          <Icon name="users" size={14} /> {user.username}
        </span>
        <form class="logout-form" method="POST" action="/logout">
          <button class="icon-button" type="submit" aria-label="Keluar" title="Keluar">
            <Icon name="logout" size={17} />
          </button>
        </form>
      {:else}
        <a class="btn primary small header-login" href="/login?redirect=/perangkat-daerah">Masuk</a>
      {/if}
      <button
        class="icon-button"
        type="button"
        onclick={toggleTheme}
        aria-label={theme === 'dark' ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
        title={theme === 'dark' ? 'Mode terang' : 'Mode gelap'}
      >
        <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={17} />
      </button>
    </div>
  </div>
</header>

<main id="main">
  {@render children()}
</main>

<footer class="site-footer">
  <div class="wrap footer-inner">
    <div class="footer-brand">
      <img
        class="brand-logo footer-logo"
        src="/logo-sulbar.svg"
        alt="Lambang Provinsi Sulawesi Barat"
        width="40"
        height="40"
      />
      <div>
        <strong>Pemerintah Provinsi Sulawesi Barat</strong>
        <p>
          Rekap kehadiran rapat, penyelesaian disposisi, dan perjalanan dinas kepala Perangkat
          Daerah 2026.
        </p>
        <a
          class="vision-mark footer-vision"
          href="/"
          title="Visi Pemprov Sulawesi Barat: Maju & Sejahtera"
          aria-label="Visi Pemprov Sulawesi Barat: Maju dan Sejahtera"
        >
          <img src="/logo-maju-sejahtera.svg" alt="Maju & Sejahtera" width="116" height="38" />
        </a>
      </div>
    </div>
    <nav class="footer-links" aria-label="Tautan footer">
      <a href="/">Ringkasan</a>
      <a href="/perangkat-daerah">Perangkat Daerah</a>
      <a href="/metodologi">Metodologi</a>
    </nav>
    <p class="footer-note">
      Sumber: Rekap Tim Staf Sekda.
    </p>
  </div>
</footer>

<nav class="mobile-nav" aria-label="Navigasi bawah">
  {#each navItems as item}
    <a href={item.href} class:active={isActive(item.href)} aria-current={isActive(item.href) ? 'page' : undefined}>
      <Icon name={item.icon} size={19} />
      <span>{item.short ?? item.label}</span>
    </a>
  {/each}
  {#if user?.role === 'superadmin'}
    <a href="/admin" class:active={isActive('/admin')} aria-current={isActive('/admin') ? 'page' : undefined}>
      <Icon name="shield" size={19} />
      <span>Admin</span>
    </a>
  {/if}
</nav>
