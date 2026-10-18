# 0003 — Commits use a GitHub noreply email, enforced

**Status:** accepted · 2026-10-17

## Context

Every commit records an author name and email, and they become public with the repository. A
machine set up for other work can silently sign a commit with the wrong identity.

## Decision

- Commits are authored with the contributor's GitHub `noreply` address
  (`<id>+<user>@users.noreply.github.com`), set in the repository's local git config.
- A `pre-commit` hook refuses any commit whose author email is not a GitHub `noreply` address.
- The repository is pushed through its own SSH host alias, so the key of another account cannot
  push to it by mistake.
- On GitHub, "Block command line pushes that expose my email" stays on.

## Consequences

- No real email reaches the history, even by accident.
- A new clone must set its local `user.email` once; the hook says so on the first commit.
