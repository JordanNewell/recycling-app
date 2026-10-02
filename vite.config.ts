import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
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
    })
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

