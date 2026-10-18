// Runs on the files of each commit, so a broken style or a leak never reaches history.
export default {
  '*.{ts,mjs}': ['prettier --write', 'eslint --max-warnings=0 --no-warn-ignored'],
  '*.{json,md,yml,yaml,css,html}': ['prettier --write'],
  '*': ['secretlint', 'node scripts/check-denylist.mjs'],
};
