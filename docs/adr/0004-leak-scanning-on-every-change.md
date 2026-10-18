# 0004 — Every change is scanned for leaks

**Status:** accepted · 2026-10-17

## Context

A secret or a piece of private data that reaches a public repository is exposed for good: removing
it later does not unpublish it. Reviews miss things, so the check must be automatic, and cheap
enough to run on every change.

## Decision

Three layers, each scanning **only what changed**:

1. **`secretlint`** — known secret formats (private keys, tokens, credentials in URLs). Runs on the
   staged files in `pre-commit` and on the changed files in CI. Blocks.
2. **Denylist** — words the owner knows are private (names, emails, paths, addresses). Runs next to
   `secretlint`. Blocks. The list itself is private: it lives outside the repository on the
   developer's machine and as a GitHub Actions secret in CI.
3. **`leak-guard`** — a read-only review agent that reads the pull request diff for what rules cannot
   see: a real name in a comment, a screenshot, an internal URL, sample data that is too real.
   Runs before each pull request, next to `hexagonal-guard`.

## Consequences

- A commit with a known secret or a denylisted word never leaves the machine.
- Cost stays proportional to the change, not to the size of the repository.
- The denylist must be kept up to date by the owner; nothing in the repository reveals what it holds.
