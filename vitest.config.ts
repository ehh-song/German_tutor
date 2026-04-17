import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    globals: true,
    globalSetup: './tests/helpers/globalSetup.ts',
    env: {
      DATABASE_URL: 'file:./test.db',
      AUTH_SECRET: 'test-secret-for-vitest-only-must-be-32chars',
      NEXTAUTH_SECRET: 'test-secret-for-vitest-only-must-be-32chars',
      ANTHROPIC_API_KEY: 'sk-test-not-real',
      NODE_ENV: 'test',
    },
    include: ['tests/**/*.test.ts'],
    sequence: { concurrent: false },
  },
})
