// @ts-check
// Lint rules, including the layer boundaries described in docs/architecture.md.
// A boundary here is a build failure, not a review comment.

import eslint from '@eslint/js';
import prettier from 'eslint-config-prettier';
import angular from 'angular-eslint';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import { importX } from 'eslint-plugin-import-x';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const LAYERED_PACKAGES = ['agent', 'app', 'relay'];

/** Each layer imports only the ones below it; composition roots import everything. */
function layerZones(pkg) {
  const src = `./packages/${pkg}/src`;
  const roots = [`${src}/main.ts`, `${src}/config.ts`, `${src}/app.config.ts`];
  const layer = (name) => `${src}/${name}`;
  return [
    ...['L2_application', 'L3_periphery', 'LR_render', ...roots].map((from) => ({
      target: layer('L1_domain'),
      from: from.startsWith('.') ? from : layer(from),
      message: 'L1_domain is the center: it imports no other layer.',
    })),
    ...['L3_periphery', 'LR_render', ...roots].map((from) => ({
      target: layer('L2_application'),
      from: from.startsWith('.') ? from : layer(from),
      message: 'L2_application imports only L1_domain.',
    })),
    ...['LR_render', ...roots].map((from) => ({
      target: layer('L3_periphery'),
      from: from.startsWith('.') ? from : layer(from),
      message: 'L3_periphery adapters never reach into the view or the composition root.',
    })),
    ...['L3_periphery', ...roots].map((from) => ({
      target: layer('LR_render'),
      from: from.startsWith('.') ? from : layer(from),
      message: 'LR_render gets adapters through ports from the composition root, never by import.',
    })),
  ];
}

const pureLayers = LAYERED_PACKAGES.flatMap((pkg) => [
  `packages/${pkg}/src/L1_domain/**/*.ts`,
  `packages/${pkg}/src/L2_application/**/*.ts`,
]);

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/coverage/**',
      '**/node_modules/**',
      '**/.wrangler/**',
      '**/.angular/**',
      '.atl/**',
      '.codegraph/**',
    ],
  },
  eslint.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: [
            '*.mjs',
            '*.ts',
            'packages/agent/build.mjs',
            'packages/app/build.mjs',
          ],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: { 'import-x': importX },
    settings: {
      'import-x/resolver-next': [
        createTypeScriptImportResolver({
          project: 'packages/*/tsconfig.json',
          noWarnOnMultipleProjects: true,
        }),
      ],
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      // Messages are built from numbers on purpose ('port ' + port); a template is no clearer.
      '@typescript-eslint/restrict-plus-operands': ['error', { allowNumberAndString: true }],
      // `''` means "not set" for env vars and DOM values, so `||` is the intended operator there.
      '@typescript-eslint/prefer-nullish-coalescing': [
        'error',
        { ignorePrimitives: { string: true } },
      ],
      // `() => this.close()` as a callback is idiomatic; a void returned from a block is not.
      '@typescript-eslint/no-confusing-void-expression': [
        'error',
        { ignoreArrowShorthand: true, ignoreVoidOperator: true },
      ],
      'import-x/no-restricted-paths': [
        'error',
        { zones: LAYERED_PACKAGES.flatMap((pkg) => layerZones(pkg)) },
      ],
      'import-x/no-cycle': 'error',
      'import-x/no-self-import': 'error',
      'import-x/no-useless-path-segments': 'error',
      eqeqeq: ['error', 'always'],
      'no-console': 'off',
    },
  },
  {
    files: [
      'packages/agent/**/*.{ts,mjs}',
      'packages/app/build.mjs',
      '*.{ts,mjs}',
      'scripts/**/*.mjs',
    ],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['packages/app/src/**/*.ts'],
    languageOptions: { globals: globals.browser },
    rules: {
      // The app runs in a browser; Node types exist only for its tests.
      'no-restricted-imports': ['error', { patterns: [{ group: ['node:*', 'ws'] }] }],
      'no-restricted-globals': ['error', 'Buffer', 'process', 'require'],
    },
  },
  {
    files: ['packages/app/src/**/*.ts'],
    extends: [angular.configs.tsRecommended],
    processor: angular.processInlineTemplates,
    rules: {
      // An Angular component is a decorated class, often with nothing but a constructor.
      '@typescript-eslint/no-extraneous-class': ['error', { allowWithDecorator: true }],
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'app', style: 'kebab-case' },
      ],
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'app', style: 'camelCase' },
      ],
    },
  },
  {
    files: ['packages/app/src/**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
  },
  {
    // Templates (inline ones are linted as .html) go through Angular's template parser, which
    // has no type information; the type-aware TypeScript rules cannot run on them.
    files: ['packages/app/src/**/*.html'],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    // The service worker runs in a worker scope: no DOM, no Node.
    files: ['packages/app/sw/**/*.ts'],
    languageOptions: { globals: globals.serviceworker },
    rules: {
      'no-restricted-imports': ['error', { patterns: [{ group: ['node:*', 'ws'] }] }],
      'no-restricted-globals': ['error', 'Buffer', 'process', 'require'],
    },
  },
  {
    files: ['packages/relay/src/**/*.ts'],
    languageOptions: { globals: globals.serviceworker },
    rules: {
      // The relay runs in workerd, not Node; Web APIs only.
      'no-restricted-imports': ['error', { patterns: [{ group: ['node:*', 'ws'] }] }],
      'no-restricted-globals': ['error', 'Buffer', 'process', 'require'],
    },
  },
  {
    // L1 and L2 are plain TypeScript: no Node, no network, no browser.
    files: pureLayers,
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['node:*', 'ws', 'fs', 'path', 'os', 'crypto', 'child_process'],
              message: 'L1 and L2 are plain TypeScript; reach the outside world through a port.',
            },
            {
              group: ['@angular/*', 'rxjs', 'rxjs/*'],
              message: 'L1 and L2 stay framework-free (ADR 0007); Angular lives in L3 and LR.',
            },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        ...[
          'window',
          'document',
          'localStorage',
          'sessionStorage',
          'navigator',
          'location',
          'WebSocket',
          'fetch',
          'alert',
          'Buffer',
          'process',
          'require',
        ].map((name) => ({
          name,
          message: 'L1 and L2 are plain TypeScript; reach the outside world through a port.',
        })),
      ],
    },
  },
  {
    files: ['**/*.mjs', 'packages/*/test/**/*.ts'],
    rules: {
      // Tests reach into results the type system cannot narrow, and drive fakes with `!`.
      '@typescript-eslint/no-non-null-assertion': 'off',
      // Fakes implement async ports with synchronous bodies, and no-op callbacks on purpose.
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-empty-function': 'off',
    },
  },
  {
    // Root config files sit outside every tsconfig, so type-aware rules cannot run on them.
    files: ['**/*.mjs', 'vitest.config.ts'],
    ...tseslint.configs.disableTypeChecked,
  },
  prettier,
);
