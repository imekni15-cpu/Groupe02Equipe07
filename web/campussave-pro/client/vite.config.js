import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'CampusSave, les invendus du campus à prix étudiant',
        short_name: 'CampusSave',
        description: 'Réserve les invendus des commerces autour de ta fac jusqu’à −70 %, confirme par e-mail et retire avec ton QR code.',
        lang: 'fr', dir: 'ltr', theme_color: '#2447F5', background_color: '#F2F5FB', display: 'standalone', orientation: 'portrait', start_url: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          { urlPattern: /\/photos\/.*\.jpg$/, handler: 'CacheFirst', options: { cacheName: 'cs-photos', expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 30 } } },
          { urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/, handler: 'StaleWhileRevalidate', options: { cacheName: 'cs-fonts' } },
          { urlPattern: /\/api\/offers/, handler: 'NetworkFirst', options: { cacheName: 'cs-offers', networkTimeoutSeconds: 4, expiration: { maxAgeSeconds: 3600 } } },
        ],
      },
    }),
  ],
  server: { port: 5173, proxy: { '/api': 'http://localhost:5000' } },
})
