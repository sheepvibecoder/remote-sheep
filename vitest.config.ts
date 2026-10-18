import { defineConfig } from 'vitest/config';

// Coverage is a gate, not a report: `pnpm test:coverage` (and CI) fail below these.
// The view (LR_render) and the composition roots are excluded: the view is checked in a
// real browser before a release, and the roots only wire adapters together.
export default defineConfig({
  test: {
    include: ['packages/*/test/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      // The app's service worker lives in `sw/`, outside `src/`, so it is not measured: it needs
      // a worker scope Node lacks and is checked in a real browser, like the view.
      include: ['packages/*/src/**/*.ts'],
      exclude: [
        'packages/*/src/LR_render/**',
        'packages/*/src/main.ts',
        'packages/agent/src/config.ts',
        // Binds workerd globals (WebSocketPair) that Node lacks; exercised by `wrangler dev`.
        'packages/relay/src/L3_periphery/cloudflare/cloudflare-platform.ts',
      ],
      reporter: ['text-summary', 'html'],
      // One key per package and layer: a glob spanning packages would average them, and a
      // package with no tests could hide behind another one.
      thresholds: {
        'packages/protocol/src/**': { lines: 90, branches: 85, functions: 90, statements: 90 },
        ...Object.fromEntries(
          ['agent', 'app', 'relay'].flatMap((pkg) => [
            [
              `packages/${pkg}/src/L1_domain/**`,
              { lines: 90, branches: 90, functions: 90, statements: 90 },
            ],
            [
              `packages/${pkg}/src/L2_application/**`,
              { lines: 80, branches: 75, functions: 80, statements: 80 },
            ],
            [
              `packages/${pkg}/src/L3_periphery/**`,
              { lines: 70, branches: 65, functions: 70, statements: 70 },
            ],
          ]),
        ),
      },
    },
  },
});
