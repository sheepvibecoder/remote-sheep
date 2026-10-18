// Refuses a commit whose author email is not a GitHub noreply address (ADR 0003), so a machine
// set up for other work cannot sign this repository's history with a real email.
import { execFileSync } from 'node:child_process';

const NOREPLY = /^\d+\+[A-Za-z0-9-]+@users\.noreply\.github\.com$/;

const ident = execFileSync('git', ['var', 'GIT_AUTHOR_IDENT'], { encoding: 'utf8' });
const email = /<([^>]*)>/.exec(ident)?.[1] ?? '';

if (!NOREPLY.test(email)) {
  console.error(
    [
      'Commit refused: the author email is not a GitHub noreply address.',
      'Set it for this repository only:',
      '  git config user.email "<id>+<user>@users.noreply.github.com"',
      'Find yours at https://github.com/settings/emails.',
    ].join('\n'),
  );
  process.exit(1);
}
