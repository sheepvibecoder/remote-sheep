// Bundles the agent into one file and puts the phone app next to it, so the
// published package is just dist/ and runs with `npx remote-sheep`.

import { build } from 'esbuild';
import { cpSync, existsSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const app = join(here, '..', 'app', 'dist');
const out = join(here, 'dist');

if (!existsSync(app)) {
  console.error('packages/app/dist is missing: run `pnpm build` from the repository root.');
  process.exit(1);
}

rmSync(out, { recursive: true, force: true });

await build({
  entryPoints: [join(here, 'src', 'main.ts')],
  outfile: join(out, 'remote-sheep.js'),
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  // ws and qrcode stay real dependencies: ws's optional native helpers are never
  // bundled, and qrcode is CommonJS that requires Node built-ins at runtime,
  // which an ESM bundle cannot do.
  external: ['ws', 'bufferutil', 'utf-8-validate', 'qrcode'],
  banner: { js: '#!/usr/bin/env node' },
});

cpSync(app, join(out, 'app'), { recursive: true });
console.log('built dist/remote-sheep.js and dist/app');
