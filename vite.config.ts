/**
 * Vite конфигурация как альтернатива Webpack
 * Более быстрая сборка для современных проектов
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';

  return {
    plugins: [
      react(),

      // Генерация TypeScript деклараций
      dts({
        insertTypesEntry: true,
        exclude: ['**/*.test.*', '**/*.spec.*']
      }),

      // Анализ bundle размера
      visualizer({
        filename: 'dist/bundle-analysis.html',
        open: false,
        gzipSize: true,
        brotliSize: true
      })
    ],

    resolve: {
      alias: {
        '@': resolve(__dirname, 'src')
      }
    },

    build: {
      lib: {
        entry: {
          index: resolve(__dirname, 'src/index.ts'),
          hooks: resolve(__dirname, 'src/hooks/index.ts'),
          components: resolve(__dirname, 'src/components/index.ts'),
          utils: resolve(__dirname, 'src/utils/index.ts'),
          debug: resolve(__dirname, 'src/debug/index.ts')
        },
        formats: ['es', 'cjs'],
        name: 'StickyLib'
      },

      rollupOptions: {
        // Externals - не включаем в bundle
        external: [
          'react',
          'react-dom',
          'mobx',
          'mobx-react-lite'
        ],

        output: {
          globals: {
            react: 'React',
            'react-dom': 'ReactDOM',
            mobx: 'mobx',
            'mobx-react-lite': 'mobxReactLite'
          },

          // Чистые имена для chunk'ов
          chunkFileNames: (chunkInfo) => {
            const facadeModuleId = chunkInfo.facadeModuleId
              ? chunkInfo.facadeModuleId.split('/').pop()?.replace('.ts', '')
              : 'chunk';
            return `${facadeModuleId}-[hash].js`;
          }
        }
      },

      // Оптимизация минификации
      minify: isProduction ? 'terser' : false,
      terserOptions: {
        compress: {
          drop_console: isProduction,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.debug']
        }
      },

      // Source maps
      sourcemap: !isProduction,

      // Размер chunk'ов
      chunkSizeWarningLimit: 500, // 500kb warning

      // CSS code splitting
      cssCodeSplit: true
    },

    // Оптимизация для development
    esbuild: {
      drop: isProduction ? ['console', 'debugger'] : []
    }
  };
});
