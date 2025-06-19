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
      react({
        jsxRuntime: 'automatic'
      }),

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
        entry: resolve(__dirname, 'src/index.ts'),
        formats: ['es', 'cjs'],
        name: 'stuckin',
        fileName: (format) => `index.${format === 'cjs' ? 'cjs' : 'js'}`
      },

      rollupOptions: {
        // Externals - не включаем в bundle
        external: [
          'react',
          'react-dom',
          'react/jsx-runtime',
          'react/jsx-dev-runtime',
          'mobx',
          'mobx-react-lite'
        ],

        output: {
          globals: {
            react: 'React',
            'react-dom': 'ReactDOM',
            'react/jsx-runtime': 'ReactJSXRuntime',
            'react/jsx-dev-runtime': 'ReactJSXDevRuntime',
            mobx: 'mobx',
            'mobx-react-lite': 'mobxReactLite'
          },
          // Собираем всё в один файл без chunks
          inlineDynamicImports: true
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
      sourcemap: !isProduction
    },

    // Оптимизация для development
    esbuild: {
      drop: isProduction ? ['console', 'debugger'] : []
    }
  };
});
