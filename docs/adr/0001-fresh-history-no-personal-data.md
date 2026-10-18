# 0001 — The repository starts with a fresh history

**Status:** accepted · 2026-10-17

## Context

remote-sheep grew in a private repository whose history holds personal emails, local paths, the
names of unrelated projects and working notes. Making a repository public publishes its whole
history, not only its latest files.

## Decision

The project continues in a new repository with a single initial commit. Only tracked source files
are carried over; working notes, local paths and real project names are left behind or replaced by
fictitious ones in tests.

## Consequences

- Nothing from the old history can leak when the repository goes public.
- The old commit history is gone; what changed in each version lives in `CHANGELOG.md`, and the
  decisions worth keeping live here.
