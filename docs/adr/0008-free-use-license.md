# 0008 — Free to use, owned and sold only by the owner

**Status:** accepted · 2026-10-20 · replaces the licensing part of [0006](0006-proprietary-private-until-public.md)

## Context

remote-sheep is about to be published as a Herdr plugin. Herdr installs a plugin by cloning its
public GitHub repository and building it on the user's computer, so an all-rights-reserved license
would forbid the very install the marketplace offers. The owner wants it free for everyone, but
keeps the authorship and the sole right to make money from it.

## Decision

- The Software uses the **remote-sheep Free Use License** (`LICENSE`): anyone may install, build,
  run and deploy their own relay for free, at home or at work, and change it for their own use.
- Nobody but the owner may sell it, charge for it, offer it as a paid service or distribute copies
  or forks. The owner keeps every other right, including commercial licenses.
- Contributions are licensed to the owner with the right to relicense and sell them.
- Every `package.json` says `"license": "SEE LICENSE IN LICENSE"`.

## Consequences

- The repository can go public and be installed with `herdr plugin install`.
- It is source-available, not open source: it must not be called "open source".
- The license is custom; a lawyer should review it before the owner sells commercial licenses.
