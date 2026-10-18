// Blocks files (and commit messages) that contain a term from the owner's private denylist
// (ADR 0004). The list never lives in the repository, and a match is reported by its line in the
// list, never by the term itself, so CI logs cannot reveal what the list holds.
//
// Usage: node scripts/check-denylist.mjs <file>...
//        node scripts/check-denylist.mjs --message <commit-msg-file>
//
// The list comes from, in order: the LEAK_DENYLIST variable (its content, as CI passes a
// secret), the file named by LEAK_DENYLIST_FILE, or ~/.config/sheep-guard/denylist.txt.
// One term per line, case-insensitive; empty lines and lines starting with # are ignored.
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, relative } from 'node:path';

const DEFAULT_LIST = join(homedir(), '.config', 'sheep-guard', 'denylist.txt');

function loadList() {
  const inline = process.env['LEAK_DENYLIST'];
  if (inline) return inline;
  const path = process.env['LEAK_DENYLIST_FILE'] || DEFAULT_LIST;
  if (!existsSync(path)) {
    console.error(
      [
        `Denylist not found: ${path}`,
        'Create it (one private term per line) or point LEAK_DENYLIST_FILE at it.',
        'It must live outside the repository.',
      ].join('\n'),
    );
    process.exit(1);
  }
  return readFileSync(path, 'utf8');
}

const terms = loadList()
  .split(/\r?\n/)
  .map((line, index) => ({ term: line.trim().toLowerCase(), entry: index + 1 }))
  .filter(({ term }) => term !== '' && !term.startsWith('#'));

const args = process.argv.slice(2);
const isMessage = args[0] === '--message';
const files = isMessage ? args.slice(1) : args;

const findings = [];
for (const file of files) {
  if (!existsSync(file)) continue; // deleted in this change
  const bytes = readFileSync(file);
  // Binary files (images, fonts) cannot be read as text; leak-guard reviews them instead.
  if (bytes.includes(0)) continue;
  // The path is checked relative to the repository: the part above it belongs to the machine.
  const name = isMessage ? 'commit message' : relative(process.cwd(), file).replaceAll('\\', '/');
  const lines = [isMessage ? '' : name, ...bytes.toString('utf8').split(/\r?\n/)];
  lines.forEach((text, index) => {
    const lower = text.toLowerCase();
    for (const { term, entry } of terms) {
      if (lower.includes(term)) {
        // Line 0 is the file's own path.
        findings.push(`${name}:${index} matches denylist entry ${entry}`);
      }
    }
  });
}

if (findings.length > 0) {
  console.error(['Private data found:', ...findings.map((f) => `  ${f}`)].join('\n'));
  process.exit(1);
}
