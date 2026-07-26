import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
    exclude: ['tests/e2e/**', '**/node_modules/**', '.next/**'],
  },
});
