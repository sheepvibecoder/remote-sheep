# 0007 — The phone app moves to Angular

**Status:** accepted · 2026-10-17

## Context

The phone app builds its whole view by hand with DOM calls. It worked for a placeholder, but makes
the coming redesign slow and fragile.

## Decision

`packages/app` moves to Angular, keeping its four layers:

- `L1_domain` and `L2_application` stay plain TypeScript, with no Angular inside.
- `L3_periphery` adapters (WebSocket, IndexedDB, push, updates) become providers behind the L1 ports.
- `LR_render` becomes pages, components and signal-based view models.
- The composition root becomes the Angular application config.

`protocol`, `agent` and `relay` do not change. The migration goes screen by screen, one pull request
each, and the current app keeps working until Angular replaces it.

## Consequences

- A larger bundle than plain TypeScript; acceptable for a PWA on the LAN or behind Cloudflare.
- The build moves from Vite to the Angular CLI; the agent bundle and the relay assets follow its
  output folder.
