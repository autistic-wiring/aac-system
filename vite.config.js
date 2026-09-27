import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { readFileSync } from 'fs'
import { defaultVocabulary } from './src/data/defaultVocabulary.js'

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))

// Audio files actually referenced by buttons (audioId || id, folders excluded).
// Only these are precached for offline — the rest of public/audio/ are orphans.
const usedAudioKeys = new Set(
  [
    ...defaultVocabulary.core,
    ...defaultVocabulary.folders,
    ...Object.values(defaultVocabulary.categories).flat(),
  ]
    .filter((item) => item.type !== 'folder')
    .map((item) => item.audioId || item.id)
)

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icons/*.svg', 'icons/*.png'],
      manifest: {
        name: 'AAC Board',
        short_name: 'AAC',
        description: 'Augmentative and Alternative Communication board for toddlers',
        theme_color: '#6C63FF',
        background_color: '#6C63FF',
        display: 'fullscreen',
        display_override: ['fullscreen', 'standalone'],
        orientation: 'landscape',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,webp}', 'audio/*.wav'],
        // Precache only button sounds in use; orphan wavs stay out of the SW install.
        manifestTransforms: [
          (entries) => ({
            manifest: entries.filter((entry) => {
              if (!entry.url.startsWith('audio/') || !entry.url.endsWith('.wav')) return true
              return usedAudioKeys.has(entry.url.slice('audio/'.length, -'.wav'.length))
            }),
            warnings: [],
          }),
        ],
        runtimeCaching: [
          {
            urlPattern: /^http:\/\/127\.0\.0\.1:5050\//,
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
})
