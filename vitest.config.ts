import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    // No especificar environment aquí para permitir configuraciones específicas
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'coverage/',
        '**/*.d.ts',
        '**/*.config.{js,ts}',
        '**/test/**',
        '**/*.test.{js,ts}',
        '**/*.spec.{js,ts}',
      ],
    },
  },
})
