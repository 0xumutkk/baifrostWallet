import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      include: ['buffer', 'crypto', 'stream', 'util', 'process'],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'Predictive Financial Agent',
        short_name: 'PFA',
        description: 'Autonomous Web3 Financial Agent powered by Tether WDK',
        theme_color: '#0891b2',
        background_color: '#111827',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\./,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60, // 1 hour
              },
            },
          },
        ],
      },
    }),
  ],
  define: {
    'global': 'globalThis',
  },
  build: {
    target: 'es2020',
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2020',
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, res) => {
            console.log('❌ [Vite Proxy] Error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('🔄 [Vite Proxy] Proxying:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('✅ [Vite Proxy] Response:', req.method, req.url, proxyRes.statusCode);
          });
        },
      },
    },
    headers: {
      'Content-Security-Policy': "script-src 'self' 'unsafe-eval' 'unsafe-inline' blob:; worker-src 'self' blob:; object-src 'none';",
    },
    hmr: {
      overlay: true,
    },
  },
})
