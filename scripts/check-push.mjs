// Refuses a push that GitHub cannot refuse for us: branch protection needs a paid plan on a
// private repository, so this pre-push hook keeps main, develop and testing pull-request only,
// and keeps the local timezone out of published commits (every date must be +0000).
//
// A pull request is merged by fast-forwarding the shared branch to the commits already pushed
// for it, never with GitHub's merge button: GitHub re-dates the commits it writes in the
// account's local timezone.
//
// Git passes one line per ref on stdin: `<local ref> <local sha> <remote ref> <remote sha>`.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const PROTECTED = new Set(['refs/heads/main', 'refs/heads/develop', 'refs/heads/testing']);
const ZERO = /^0+$/;

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();

const isAncestor = (older, newer) => {
  try {
    execFileSync('git', ['merge-base', '--is-ancestor', older, newer]);
    return true;
  } catch {
    return false; // not an ancestor, or a commit this clone has never seen
  }
};

const problems = [];
for (const line of readFileSync(0, 'utf8').split('\n')) {
  const [, localSha, remoteRef, remoteSha] = line.trim().split(' ');
  if (!remoteRef || !localSha || !remoteSha) continue;

  if (PROTECTED.has(remoteRef)) {
    // Allowed only as a merge: moving forward, publishing nothing a pull request did not carry.
    const merge =
      !ZERO.test(localSha) &&
      !ZERO.test(remoteSha) &&
      isAncestor(remoteSha, localSha) &&
      git('rev-list', localSha, '--not', '--remotes') === '';
    if (!merge) {
      problems.push(`${remoteRef.replace('refs/heads/', '')} only changes through a pull request`);
    }
    continue;
  }
  if (ZERO.test(localSha)) continue; // deleting a feature branch

  // Only the commits this push publishes: the ones no remote branch has yet.
  const outgoing = git(
    'rev-list',
    '--format=%h %ad %cd',
    '--date=format:%z',
    localSha,
    '--not',
    '--remotes',
  );
  for (const entry of outgoing.split('\n')) {
    const [sha, authorZone, committerZone] = entry.split(' ');
    if (entry.startsWith('commit ') || !committerZone) continue;
    if (authorZone !== '+0000' || committerZone !== '+0000') {
      problems.push(`${sha} carries a local timezone; recommit it with TZ=UTC`);
    }
  }
}

if (problems.length > 0) {
  console.error(['Push refused:', ...problems.map((problem) => '  - ' + problem)].join('\n'));
  process.exit(1);
}
