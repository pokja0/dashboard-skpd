import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    sveltekit({
      preprocess: vitePreprocess(),
      adapter: adapter(),
      csrf: {
        // Izinkan form login saat aplikasi dijalankan lewat HTTP lokal.
        // Produksi tetap memakai origin HTTPS dari reverse proxy.
        trustedOrigins: [
          'http://localhost:3000',
          'http://127.0.0.1:3000',
          'http://localhost:4173',
          'http://127.0.0.1:4173'
        ]
      }
    })
  ]
});
