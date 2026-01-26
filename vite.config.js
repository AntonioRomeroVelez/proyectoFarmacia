import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'public',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      includeAssets: ['logo.png', 'icon-192x192.png', 'icon-512x512.png', 'favicon.png', 'favicon.ico'],
      manifest: {
        name: 'Sistema de Gestión Farmacéutica',
        short_name: 'SistemaGestión',
        description: 'Sistema de gestión de productos farmacéuticos con comparación de precios, generación de reportes y notificaciones',
        theme_color: '#6cbdffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        orientation: 'any',
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        // Capacidades PWA avanzadas
        categories: ['business', 'productivity'],
        shortcuts: [
          {
            name: 'Agenda',
            short_name: 'Agenda',
            description: 'Ver eventos programados',
            url: '/agenda',
            icons: [{ src: '/icon-192x192.png', sizes: '192x192' }]
          },
          {
            name: 'Productos',
            short_name: 'Productos',
            description: 'Gestionar productos',
            url: '/productos',
            icons: [{ src: '/icon-192x192.png', sizes: '192x192' }]
          }
        ]
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB
      },
      devOptions: {
        enabled: false, // Deshabilitado en dev, solo funciona en build
        type: 'module'
      }
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})

