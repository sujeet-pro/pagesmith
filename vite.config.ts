import { defineConfig } from 'vite-plus'

export default defineConfig({
  test: {
    projects: ['packages/core', 'packages/content', 'packages/pagesmith'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['packages/*/src/**/*.ts'],
      exclude: ['**/*.d.ts', '**/node_modules/**'],
    },
  },
  lint: {
    rules: {
      'no-unused-vars': 'off',
      'no-console': 'off',
      'no-debugger': 'error',
      eqeqeq: ['error', 'smart'],
      'unicorn/no-useless-fallback-in-spread': 'off',
    },
    ignorePatterns: ['node_modules/', 'dist/', 'dev/', 'gh-pages/', '.diagrams/'],
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: {
    semi: false,
    singleQuote: true,
    trailingComma: 'all',
    printWidth: 100,
    ignorePatterns: [
      'node_modules/',
      'dist/',
      'dev/',
      'gh-pages/',
      '.diagrams/',
      '**/*.hbs',
      '**/*.ejs',
      '**/*.css',
      '**/*.md',
    ],
  },
  staged: {
    '*': 'vp check --fix',
  },
})
