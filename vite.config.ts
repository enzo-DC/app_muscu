/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Une nouvelle version s'installe toute seule ; les données restent dans IndexedDB.
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'favicon.svg', 'apple-touch-icon.png', 'favicon-32.png'],
      manifest: {
        name: 'Fonte',
        short_name: 'Fonte',
        description: 'Ton carnet d’entraînement : séances, charges, répétitions.',
        lang: 'fr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#F5F1EA',
        background_color: '#F5F1EA',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Tout le site est mis en cache : l'app marche en mode avion à la salle
        // Photos des exercices comprises (~14 Mo, téléchargées une fois à l'installation)
        globPatterns: ['**/*.{js,css,html,woff2,png,svg,webp}'],
        // Écrans de lancement : utilisés par iOS seulement au démarrage, inutile de les mettre en cache
        globIgnores: ['splash/**'],
        navigateFallback: 'index.html',
      },
    }),
  ],
  css: {
    modules: { localsConvention: 'camelCaseOnly' },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: { modules: { classNameStrategy: 'non-scoped' } },
  },
});
