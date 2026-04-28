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
  const plugins = [
    figmaAssetResolver(),
    react(),
    tailwindcss(),
  ]

  if (enableAnalyzer) {
    plugins.push(
      visualizer({
        filename: 'stats.html',
        open: mode === 'development',
        gzipSize: true,
        brotliSize: true,
      }),
    )
  }

  return {
    plugins,
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

            if (id.includes('react-dom') || id.match(/[\\/]node_modules[\\/]react[\\/]/)) {
              return 'react-core'
            }

            if (id.includes('react-router')) {
              return 'router'
            }

            if (id.includes('motion')) {
              return 'motion'
            }

            if (id.includes('lucide-react')) {
              return 'icons'
            }

            if (id.includes('@radix-ui')) {
              return 'radix'
            }

            if (id.includes('@mui') || id.includes('@emotion')) {
              return 'mui'
            }

            if (id.includes('jspdf')) {
              return 'exports'
            }

            if (id.includes('@supabase')) {
              return 'supabase'
            }

            return undefined
          },
        },
      },
    },
    assetsInclude: ['**/*.svg', '**/*.csv'],
  }
})
