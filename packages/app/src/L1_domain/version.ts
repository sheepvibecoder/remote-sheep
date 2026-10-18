// Versions are major.minor.patch, as every package.json in the repository has them.

const VERSION = /^(\d+)\.(\d+)\.(\d+)$/;

/** True when `candidate` is a later version than `current`; anything unparsable is not. */
export function isNewer(candidate: string, current: string): boolean {
  const a = VERSION.exec(candidate.trim());
  const b = VERSION.exec(current.trim());
  if (!a || !b) return false;
  for (let i = 1; i <= 3; i++) {
    const diff = Number(a[i]) - Number(b[i]);
    if (diff !== 0) return diff > 0;
  }
  return false;
}
