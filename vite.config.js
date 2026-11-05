import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}']
      },
      manifest: {
        name: 'IGCCST-2026 Cryogenics Simulation Hub',
        short_name: 'IGCCST-2026',
        description: 'Interactive cryogenics simulation portal for the Indo-German Conference on Cryogenics for Sustainable Technologies at IIT Kharagpur.',
        theme_color: '#0a192f',
        background_color: '#0a192f',
        display: 'standalone',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      }
    })
  ],
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
  build: {
    target: "es2020",
    minify: "terser",
    terserOptions: { compress: { drop_console: true } },
    rollupOptions: {
      output: { manualChunks: { vendor: ["react", "react-dom"] } },
    },
  },
});
