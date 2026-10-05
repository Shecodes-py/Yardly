import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  build: {
    // Preserve source CSS while diagnosing production browser differences.
    cssMinify: false,
  },
  plugins: [
    react(),
    {
      name: 'yardly-production-styles',
      transformIndexHtml: {
        order: 'post',
        handler(html, context) {
          if (context.server) return html
          // Keep the same independent source styles as development. Embedding
          // them prevents failed asset requests from leaving the page unstyled.
          const styles = ['src/index.css', 'src/dashboard.css', 'src/pages/Landing.css']
            .map(path => `<style data-yardly-style="${path}">${readFileSync(new URL(path, import.meta.url), 'utf8')}</style>`)
            .join('\n')
          return html.replace(/<link\b[^>]*rel="stylesheet"[^>]*>/g, '').replace('</head>', `${styles}\n</head>`)
        },
      },
    },
    VitePWA({
      registerType: 'autoUpdate',
      // Retire offline caches while production deployments are being stabilized.
      selfDestroying: true,
      includeAssets: ['icons/apple-touch-icon.png'],
      manifest: {
        name: 'Yardly',
        short_name: 'Yardly',
        description: 'Get things done by trusted people in your community.',
        theme_color: '#158052',
        background_color: '#f7f7f5',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkOnly',
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  server: {
    port: 5173,
  },
})
