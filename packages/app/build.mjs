// Builds the phone app into dist/: the Angular page, then the pieces the Angular CLI does not make.
//
// - The version comes from package.json, so a release bumps it in one place; the page shows it.
// - The service worker is its own classic script with a fixed name at the root: the browser
//   registers `/sw.js`, and a worker only controls its own folder down.
// - `version.json` is what "Check for updates" compares the running page against.

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, 'dist');
const { version } = JSON.parse(readFileSync(join(here, 'package.json'), 'utf8'));

execFileSync('pnpm', ['exec', 'ng', 'build', `--define=__VERSION__='${version}'`], {
  cwd: here,
  stdio: 'inherit',
  // pnpm is a .cmd shim on Windows, which only a shell can start.
  shell: process.platform === 'win32',
});

await build({
  entryPoints: [join(here, 'sw', 'service-worker.ts')],
  outfile: join(out, 'sw.js'),
  bundle: true,
  format: 'iife',
  target: 'es2022',
  minify: true,
});

writeFileSync(join(out, 'version.json'), JSON.stringify({ version }));
console.log(`built dist/ (app ${version}), dist/sw.js and dist/version.json`);
