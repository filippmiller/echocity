// Flat-config ESLint for Next.js 15 + TypeScript + a11y + promise + security.
//
// Sprint A.15 lint policy (2026-04-24):
//   - pre-existing floating-promises and bug-class rules demoted to WARN
//     so CI unblocks; file-by-file re-promotion tracked as Sprint A.15 task.
//   - NEW CODE (Sprint B files) re-enables bug-class rules at ERROR
//     via a final config block override so new surface area doesn't regress.

import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import nextPlugin from '@next/eslint-plugin-next'
import a11y from 'eslint-plugin-jsx-a11y'
import promise from 'eslint-plugin-promise'
import security from 'eslint-plugin-security'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'

export default [
  {
    ignores: [
      '.next/**',
      '.claude/**',
      'node_modules/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      'dist/**',
      'build/**',
      'next-env.d.ts',
      'prisma/migrations/**',
      'public/sw.js',
      'scripts/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx,js,jsx,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      parserOptions: {
        projectService: {
          allowDefaultProject: ['eslint.config.mjs', 'postcss.config.mjs'],
        },
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2023,
      },
    },
    plugins: {
      '@next/next': nextPlugin,
      'jsx-a11y': a11y,
      promise,
      security,
      'react-hooks': reactHooks,
    },
    rules: {
      // Next rules.
      '@next/next/no-html-link-for-pages': 'warn',
      '@next/next/no-img-element': 'warn',
      '@next/next/no-sync-scripts': 'error',
      '@next/next/no-title-in-document-head': 'error',

      // React hooks.
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // Promise-safety — WARN for legacy baseline, re-promoted per file in Sprint A.15.
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-misused-promises': [
        'warn',
        { checksVoidReturn: { attributes: false } },
      ],
      '@typescript-eslint/await-thenable': 'warn',

      // Promise hygiene.
      'promise/always-return': 'warn',
      'promise/no-return-wrap': 'warn',
      'promise/param-names': 'error',
      'promise/catch-or-return': 'warn',

      // Accessibility — all demoted to warn (Sprint D.1 absorbs).
      ...Object.fromEntries(
        Object.entries(a11y.configs.recommended.rules).map(([k, v]) => [
          k,
          Array.isArray(v) ? ['warn', ...v.slice(1)] : v === 'error' ? 'warn' : v,
        ]),
      ),

      // Security.
      'security/detect-object-injection': 'warn',
      'security/detect-non-literal-regexp': 'warn',
      'security/detect-eval-with-expression': 'error',
      'security/detect-possible-timing-attacks': 'warn',
      'security/detect-unsafe-regex': 'warn',

      // Hygiene.
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-require-imports': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      'no-empty': 'warn',
      'no-case-declarations': 'warn',
      'no-useless-escape': 'warn',
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
  // Config / non-TS files — disable type-aware rules.
  {
    files: ['**/*.{mjs,cjs,js,jsx}'],
    rules: {
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/await-thenable': 'off',
    },
  },
  // Test files.
  {
    files: ['tests/**/*', '**/*.test.ts', '**/*.spec.ts', '**/*.test.tsx', '**/*.spec.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'security/detect-non-literal-fs-filename': 'off',
    },
  },
  // NEW CODE — Sprint B files keep bug-class rules at ERROR.
  {
    files: [
      'lib/ipAllowlist.ts',
      'lib/cronLock.ts',
      'lib/observability.ts',
      'lib/cron.ts',
      'modules/payments/idempotency.ts',
      'modules/payments/scrub.ts',
      'modules/payments/financial-events.ts',
      'modules/payments/yokassa.ts',
      'app/api/payments/yokassa/webhook/route.ts',
    ],
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false } },
      ],
      '@typescript-eslint/await-thenable': 'error',
    },
  },
]
