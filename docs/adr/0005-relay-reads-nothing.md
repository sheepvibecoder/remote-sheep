# 0005 — The relay forwards sealed frames and reads none

**Status:** accepted · 2026-10-17

## Context

To reach the phone outside the local network, traffic passes through a relay on Cloudflare. Whoever
runs or breaks into that relay must not be able to read the sessions or drive the agent.

## Decision

- Phone and agent run an end-to-end handshake (X25519, triple Diffie-Hellman) on every connection
  and seal every frame with ChaCha20-Poly1305. The relay only sees sealed bytes.
- The relay authenticates nothing about the content: it matches an agent and its phones in a room
  and forwards frames between them.
- Opening a room takes an access code issued by the relay owner; a room stays with the code that
  claimed it.
- Each person deploys the relay to their own Cloudflare account; the repository holds no account id,
  route or domain.

## Consequences

- A compromised relay can drop or delay traffic, but cannot read it or forge it.
- Web Push notifications carry only the project name and the new state, never transcript content.
