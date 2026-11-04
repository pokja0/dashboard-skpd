import adapterNode from '@sveltejs/adapter-node';
import adapterVercel from '@sveltejs/adapter-vercel';
import { sveltekit } from '@sveltejs/kit/vite';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

const adapter = process.env.VERCEL ? adapterVercel() : adapterNode();

export default defineConfig({
  plugins: [
    sveltekit({
      preprocess: vitePreprocess(),
      adapter,
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
