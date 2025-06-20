/**
 * Vite конфигурация с SWC для максимальной производительности
 * SWC обеспечивает значительно более быструю сборку чем Rollup
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';

  return {
    plugins: [
      // SWC React plugin для максимальной производительности
      react({
        // SWC конфигурация
        jsxRuntime: 'automatic',
        tsDecorators: true,
        plugins: [
          // Дополнительные SWC плагины при необходимости
        ]
      }),

      // Генерация TypeScript деклараций
      dts({
        insertTypesEntry: true,
        exclude: ['**/*.test.*', '**/*.spec.*'],
        rollupTypes: true
      }),

      // Анализ bundle размера
      visualizer({
        filename: 'dist/bundle-analysis.html',
        open: false,
        gzipSize: true,
        brotliSize: true,
        template: 'treemap' // более информативный вид
      })
    ],

    resolve: {
      alias: {
        '@': resolve(__dirname, 'src')
      }
    },

    define: {
      // Безопасная замена process.env для браузера
      'process.env.NODE_ENV': JSON.stringify(mode),
      // Предотвращаем ошибки с process в браузере
      'process.env': '{}',
      global: 'globalThis',
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
          inlineDynamicImports: true,
          // Дополнительные оптимизации
          compact: true,
          minifyInternalExports: true
        },

        // Дополнительные плагины для оптимизации
        plugins: isProduction ? [
          // Дополнительная tree shaking оптимизация
        ] : []
      },

      // Оптимизация минификации через SWC (быстрее чем terser)
      minify: isProduction ? 'esbuild' : false,

      // SWC оптимизации
      target: 'es2020',

      // Source maps
      sourcemap: !isProduction
    },

    // Дополнительные esbuild оптимизации (работает совместно с SWC)
    esbuild: {
      target: 'es2020',
      drop: isProduction ? ['console', 'debugger'] : [],
      legalComments: 'none',
      minifyIdentifiers: isProduction,
      minifySyntax: isProduction,
      minifyWhitespace: isProduction,
      // Более агрессивная оптимизация
      treeShaking: true
    }
  };
});
