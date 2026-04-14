import { defineConfig } from 'vite-plus'

export default defineConfig({
  resolve: {
    alias: {
      'vite-plus/test': 'vitest',
    },
  },
  test: {
    projects: ['packages/core', 'packages/site', 'packages/docs', 'tests/e2e'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: [
        'packages/core/src/config.ts',
        'packages/core/src/content-layer.ts',
        'packages/core/src/convert.ts',
        'packages/core/src/entry.ts',
        'packages/core/src/frontmatter.ts',
        'packages/core/src/store.ts',
        'packages/core/src/toc.ts',
        'packages/core/src/loaders/index.ts',
        'packages/core/src/markdown/pipeline.ts',
        'packages/core/src/utils/*.ts',
        'packages/core/src/validation/*.ts',
        'packages/core/src/ai/content-*.ts',
        'packages/site/src/config.ts',
        'packages/site/src/cli/*.ts',
        'packages/site/src/css/builder.ts',
        'packages/site/src/jsx-runtime/index.ts',
        'packages/site/src/runtime/index.ts',
        'packages/docs/src/content.ts',
        'packages/docs/src/navigation.ts',
        'packages/docs/src/config/shared.ts',
        'packages/docs/src/config/validate.ts',
      ],
      exclude: ['**/*.d.ts', '**/node_modules/**', '**/*.test.ts', '**/__tests__/**'],
      thresholds: {
        lines: 85,
        statements: 85,
        branches: 75,
        functions: 85,
      },
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
    ignorePatterns: ['node_modules/', 'dist/', 'dev/', 'gh-pages/', 'coverage/'],
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
      'coverage/',
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
