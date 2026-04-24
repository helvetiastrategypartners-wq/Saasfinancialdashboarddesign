import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id: string) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }

      return undefined
    },
  }
}

export default defineConfig(({ mode }) => {
  const enableAnalyzer = process.env.ANALYZE === 'true'

  return {
    plugins: [
      figmaAssetResolver(),
      react(),
      tailwindcss(),
      visualizer({
        filename: 'stats.html',
        open: enableAnalyzer && mode === 'development',
        gzipSize: true,
        brotliSize: true,
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) {
              return undefined
            }

            if (id.includes('jspdf')) {
              return 'exports'
            }

            if (id.includes('@supabase')) {
              return 'supabase'
            }

            if (id.includes('recharts')) {
              return 'charts'
            }

            return undefined
          },
        },
      },
    },
    assetsInclude: ['**/*.svg', '**/*.csv'],
  }
})
