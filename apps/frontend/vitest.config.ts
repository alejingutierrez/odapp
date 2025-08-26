import { resolve } from 'path'

import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [resolve(__dirname, './src/test/setup.ts')],
    css: false,
    testTimeout: 15000, // Timeout más generoso
    hookTimeout: 10000,
    teardownTimeout: 10000,

    // Configuración de pool más robusta
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true, // Usar un solo fork para evitar conflictos
        maxForks: 1, // Máximo 1 fork
      },
    },

    // Configuración para evitar tests colgados
    isolate: true, // Aislar tests para evitar interferencias

    // Solo ejecutar tests específicos para debug
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],

    // Excluir tests problemáticos temporalmente
    exclude: [
      // All problematic tests have been fixed
    ],

    // Configuración para evitar problemas de memoria
    bail: 0, // No parar en el primer error para ver todos los problemas
    retry: 0, // No reintentar tests fallidos

    // Configuración para reportes
    reporters: ['basic'],

    // Configuración para coverage (solo cuando se solicite explícitamente)
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/coverage/**',
        '**/*.d.ts',
        '**/test/**',
        '**/__tests__/**',
        '**/stories/**',
        '**/*.stories.*',
        '**/setup.ts',
        '**/test-utils.tsx',
      ],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})
