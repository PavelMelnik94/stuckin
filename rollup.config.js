/**
 * Rollup конфигурация для создания оптимизированных bundle'ов
 */

import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import * as terser from '@rollup/plugin-terser';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import postcss from 'rollup-plugin-postcss';

const isProduction = process?.env?.NODE_ENV === 'production';

export default [
  // Основной bundle
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/index.js',
        format: 'cjs',
        sourcemap: !isProduction
      },
      {
        file: 'dist/index.es.js',
        format: 'es',
        sourcemap: !isProduction
      },
      {
        file: 'dist/index.umd.js',
        format: 'umd',
        name: 'StickyLib',
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          mobx: 'mobx',
          'mobx-react-lite': 'mobxReactLite'
        },
        sourcemap: !isProduction
      }
    ],
    plugins: [
      peerDepsExternal(), // Исключаем peer dependencies
      resolve({
        browser: true,
        preferBuiltins: false
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.build.json',
        declaration: true,
        declarationDir: 'dist/types'
      }),
      postcss({
        extract: 'sticky.css',
        minimize: isProduction,
        sourceMap: !isProduction
      }),
      ...(isProduction ? [
        terser({
          // ← ОБНОВИЛИ конфигурацию для нового плагина
          compress: {
            drop_console: true,
            drop_debugger: true,
            pure_funcs: ['console.log'],
            passes: 2 // Двойная минификация для лучшего результата
          },
          mangle: {
            safari10: true // Совместимость с Safari 10
          },
          format: {
            comments: false // Удаляем комментарии
          }
        })
      ] : [])
    ],
    external: ['react', 'react-dom', 'mobx', 'mobx-react-lite']
  },

  // Отдельные модули для tree-shaking
  {
    input: {
      hooks: 'src/hooks/index.ts',
      components: 'src/components/index.ts',
      utils: 'src/utils/index.ts'
    },
    output: {
      dir: 'dist',
      format: 'es',
      chunkFileNames: '[name]-[hash].js'
    },
    plugins: [
      peerDepsExternal(),
      resolve(),
      commonjs(),
      typescript({
        declaration: false // Типы уже генерируются в основном bundle
      }),
      ...(isProduction ? [
        terser({
          // ← ОБНОВИЛИ и здесь
          compress: {
            drop_console: true,
            drop_debugger: true
          },
          format: {
            comments: false
          }
        })
      ] : [])
    ],
    external: ['react', 'react-dom', 'mobx', 'mobx-react-lite']
  }
];
