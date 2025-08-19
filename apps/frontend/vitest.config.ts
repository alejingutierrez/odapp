import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react-swc'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    // Timeouts más estrictos para evitar tests colgados
    testTimeout: 60000, // 1 minuto por test
    hookTimeout: 30000, // 30 segundos para hooks
    teardownTimeout: 10000, // 10 segundos para cleanup

    // Configuración para estabilidad y rendimiento
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
        isolate: true,
      },
    },

    // Configuración para evitar tests colgados
    bail: 1, // Parar en el primer fallo
    retry: 1, // Reintentar una vez si falla

    // Excluir archivos del sistema
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      '**/storybook-static/**',
    ],

    // Configuración para reportes
    reporters: ['verbose'],

    // Configuración para coverage
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
      '@/components': resolve(__dirname, './src/components'),
      '@/pages': resolve(__dirname, './src/pages'),
      '@/hooks': resolve(__dirname, './src/hooks'),
      '@/services': resolve(__dirname, './src/services'),
      '@/store': resolve(__dirname, './src/store'),
      '@/utils': resolve(__dirname, './src/utils'),
      '@/types': resolve(__dirname, './src/types'),
      '@/assets': resolve(__dirname, './src/assets'),
      '@ant-design/icons': resolve(
        __dirname,
        './src/test/__mocks__/antd-icons.ts'
      ),
    },
  },
})
