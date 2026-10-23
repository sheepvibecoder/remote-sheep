// Bundles the agent into one file and puts the phone app next to it. dist/ is committed: the
// Herdr plugin runs it straight from the repository, so installing the plugin needs Node and
// nothing else — no pnpm, no node_modules, no build on the user's machine.

import { build } from 'esbuild';
import { createHash } from 'node:crypto';
import {
  cpSync,
  existsSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
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
  // Every dependency goes inside the bundle, so dist/ runs with no node_modules. Only ws's
  // optional native helpers stay out: ws loads them in a try/catch and falls back to plain
  // JavaScript when they are missing.
  external: ['bufferutil', 'utf-8-validate'],
  // ws and qrcode are CommonJS that require Node built-ins at runtime, and an ESM file has no
  // `require` of its own, so the banner makes one. The shebang must stay the first line.
  banner: {
    js: [
      '#!/usr/bin/env node',
      "import { createRequire } from 'node:module';",
      'const require = createRequire(import.meta.url);',
    ].join('\n'),
  },
});

cpSync(app, join(out, 'app'), { recursive: true });
renameHashedChunks(join(out, 'app'));
console.log('built dist/remote-sheep.js and dist/app');

// Angular names its scripts and styles after a hash that is not only of their bytes: a Windows and
// a Linux build give main.js the same bytes under different names. dist/ is committed and CI
// rebuilds it on Linux and compares byte for byte, so each chunk is renamed after a hash of its
// own content and every reference to it is rewritten. Before hashing, the names of the other
// chunks are blanked out of the content, so the result does not depend on the order chunks are
// renamed in, even when they import each other.
function renameHashedChunks(dir) {
  const CHUNK = /^(.+)-[A-Z0-9]{8}\.(js|css)$/;
  const TEXT = /\.(html|js|css|json|webmanifest)$/;
  const chunks = readdirSync(dir).filter((name) => CHUNK.test(name));
  const blank = (text) => chunks.reduce((acc, name) => acc.replaceAll(name, ''), text);
  const renames = chunks.map((name) => {
    const [, stem, ext] = CHUNK.exec(name);
    const hash = createHash('sha256')
      .update(blank(readFileSync(join(dir, name), 'utf8')))
      .digest('hex')
      .slice(0, 8)
      .toUpperCase();
    return [name, `${stem}-${hash}.${ext}`];
  });
  for (const file of readdirSync(dir).filter((name) => TEXT.test(name))) {
    const path = join(dir, file);
    const text = readFileSync(path, 'utf8');
    const next = renames.reduce((acc, [from, to]) => acc.replaceAll(from, to), text);
    if (next !== text) writeFileSync(path, next);
  }
  for (const [from, to] of renames) renameSync(join(dir, from), join(dir, to));
}
