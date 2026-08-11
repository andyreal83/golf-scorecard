/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { mockApiPlugin } from './dev/mockApiPlugin'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [
      react(),
      ...(command === 'serve' ? [mockApiPlugin(env.VITE_APP_SECRET)] : []),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icon-192.png', 'icon-512.png'],
        manifest: {
          name: 'Golf Scorecard',
          short_name: 'Scorecard',
          description: 'Hole-by-hole golf scoring with handicap net par',
          theme_color: '#0b3d1e',
          background_color: '#0b3d1e',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          icons: [
            { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          ],
        },
        // App data goes through IndexedDB + the sync engine, not the service
        // worker cache — keep the SW limited to the app shell so it can't
        // ever serve stale round data.
        workbox: {
          navigateFallbackDenylist: [/^\/api\//],
        },
      }),
    ],
    test: {
      environment: 'node',
    },
  }
})
