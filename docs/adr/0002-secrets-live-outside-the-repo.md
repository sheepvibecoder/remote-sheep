# 0002 — Secrets live outside the repository

**Status:** accepted · 2026-10-17

## Context

The agent holds an identity key, VAPID keys, the list of paired phones, uploaded photos and the
relay access code. Any of them in the repository would hand control of the agent to whoever reads it.

## Decision

- Runtime secrets live in `~/.remote-sheep` (or `REMOTE_SHEEP_HOME`), owner-only, written by the agent.
- Local settings go in `.env`, which is ignored; `.env.example` lists the variables without values.
- The relay access codes are a Cloudflare secret (`wrangler secret put`), never a value in a file.
- `.gitignore` also blocks key files, `.env.*` and uploads, in case a copy lands in the tree.

## Consequences

- Cloning the repository gives no access to anyone's agent.
- Every machine creates its own keys on first start; there is nothing to share or rotate in git.
