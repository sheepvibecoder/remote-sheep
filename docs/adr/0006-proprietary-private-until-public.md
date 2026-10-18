# 0006 — Proprietary, private until it goes public

**Status:** accepted · 2026-10-17

## Context

The project is not ready to be shared yet, and it will later be listed on the Herdr plugin
marketplace, which only indexes public repositories.

## Decision

- The code is proprietary: all rights reserved (`LICENSE`; `"license": "UNLICENSED"` in every
  `package.json`).
- The repository stays private until the owner decides to publish it.

## Consequences

- Until then, the Herdr plugin is tested locally with `herdr plugin link`.
- Before going public the license must be reviewed: a proprietary license does not allow people to
  run what the marketplace offers them.
