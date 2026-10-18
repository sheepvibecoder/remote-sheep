// Conventional Commits, scoped to the part of the repository a change touches.
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      ['protocol', 'agent', 'app', 'relay', 'ci', 'deps', 'docs', 'odd', 'repo'],
    ],
    'header-max-length': [2, 'always', 100],
    'body-max-line-length': [2, 'always', 100],
  },
};
