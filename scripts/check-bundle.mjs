// Checks that the committed agent bundle (packages/agent/dist) is what the code builds today. The
// Herdr plugin runs that bundle straight from the repository with no build step, so a release
// whose dist/ is stale ships old code. Builds the repository, then fails when git sees any
// change or new file under dist/.
//
// Usage: node scripts/check-bundle.mjs            (pnpm bundle:check)
//        node scripts/check-bundle.mjs --no-build  (CI, right after its own build step)
import { execFileSync } from 'node:child_process';

const DIST = 'packages/agent/dist';
const noBuild = process.argv.includes('--no-build');

if (!noBuild) {
  // pnpm is a .cmd shim on Windows, which only a shell can start.
  execFileSync('pnpm', ['build'], { stdio: 'inherit', shell: process.platform === 'win32' });
}

// Only empty lines go: a porcelain line starts with a space when the change is not staged.
const changed = execFileSync('git', ['status', '--porcelain', '--', DIST], { encoding: 'utf8' })
  .split('\n')
  .filter((line) => line.trim() !== '');

if (changed.length > 0) {
  console.error(
    [
      `${DIST} is not up to date with the code:`,
      ...changed.map((line) => `  ${line}`),
      '',
      'Run `pnpm build` and commit packages/agent/dist before the release.',
    ].join('\n'),
  );
  process.exit(1);
}
console.log(`${DIST} matches a fresh build.`);
