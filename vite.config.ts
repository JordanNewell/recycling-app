import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { VitePWA } from "vite-plugin-pwa"
import sourceIdentifierPlugin from 'vite-plugin-source-identifier'

const isProd = process.env.BUILD_MODE === 'prod'
// Deployment base (e.g. /recycling-app/ on GitHub Pages); unset for local dev
const base = process.env.VITE_BASE ?? '/'
export default defineConfig({
  base,
  plugins: [
    react(),
    sourceIdentifierPlugin({
      enabled: !isProd,
      attributePrefix: 'data-matrix',
      includeProps: true,
    }),
    VitePWA({
      // injectManifest: vite-plugin-pwa builds src/sw.ts and injects the
      // precache manifest in place of `self.__WB_MANIFEST`.
      strategies: 'injectManifest',
      srcDir: 'src',
      // Source filename ends up as the output name (sw.ts -> dist/sw.js),
      // keeping the SW URL identical to the old public/sw.js so already
      // installed clients pick up the update seamlessly.
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      // main.tsx registers the SW itself via `virtual:pwa-register`.
      injectRegister: false,
      manifest: {
        name: 'EcoScan - Recycling Tracker',
        short_name: 'EcoScan',
        description:
          'Scan items, track what you recycle, and watch your environmental impact grow — earn badges, keep streaks, and build a greener habit.',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait-primary',
        background_color: '#ffffff',
        theme_color: '#10b981',
        categories: ['lifestyle', 'utilities', 'productivity'],
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          {
            name: 'Scan Item',
            short_name: 'Scan',
            description: 'Quickly scan a recyclable item',
            url: './scan',
            icons: [{ src: 'icon-192.png', sizes: '192x192' }],
          },
          {
            name: 'View History',
            short_name: 'History',
            description: 'Check your recycling history',
            url: './history',
            icons: [{ src: 'icon-192.png', sizes: '192x192' }],
          },
        ],
      },
      // Feeds the precache manifest injected into src/sw.ts at build time.
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
      },
      // Intent documentation for the injectManifest strategy: src/sw.ts
      // implements the navigation fallback itself and keeps live-data
      // hosts (Supabase, AI providers) out of the cache. These options are
      // only consumed if a dev-mode SW is ever generated.
      workbox: {
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/supabase\.co/, /huggingface\.co/, /nyckel\.com/, /^\/auth\//],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['framer-motion', 'vaul', 'sonner'],
          charts: ['recharts'],
          auth: ['@supabase/supabase-js'],
        },
      },
    },
  },
})

