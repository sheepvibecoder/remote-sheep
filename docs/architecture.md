# Architecture rules

remote-sheep is a pnpm monorepo of four packages. Three of them, the agent, the phone app and the
relay, are hexagonal and split their `src/` into four layers.

```
packages/
  protocol/   shared kernel — wire types, frame codec, validators. Pure; any layer may import it.
  agent/      runs on the PC next to Herdr (Node).
  app/        the phone app (browser, Angular).
  relay/      the relay (Cloudflare Worker + Durable Object); forwards sealed frames, reads none.
```

## Layers

| Layer            | Holds                                                                                                                                                                         | May import                                                  |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `L1_domain`      | Ports (interfaces the core needs from the outside world), domain types and pure rules (`hasSettled`, `composeOrder`).                                                         | `protocol` only                                             |
| `L2_application` | Application services that orchestrate the domain through ports: `SessionHub`, `SessionMonitor` (agent), `Store` (app).                                                        | `L1_domain`, `protocol`                                     |
| `L3_periphery`   | Adapters that implement L1 ports with real technology: Herdr CLI, Claude transcripts, LAN WebSocket, secure channel, device and key files, CLI, browser WebSocket, IndexedDB. | `L1_domain`, `L2_application`, `protocol`, Node/browser/npm |
| `LR_render`      | The phone UI (app only): DOM, styles, dictation, read-aloud, photo editor.                                                                                                    | `L1_domain`, `L2_application`, `protocol`, browser          |

The relay follows the same layers: `RelayRoom` (the rules of one agent's room) is L2, the Worker and
the Durable Object with their Cloudflare adapters are L3, and its `src/main.ts` is its composition root.

The composition roots — `src/main.ts` in each package, `src/config.ts` in the agent and
`src/app.config.ts` (the Angular providers) in the app — are the only files that import every
layer. They build the adapters and hand them to the core and the view.

The Herdr plugin sits outside the four layers, like the build scripts: `herdr-plugin.toml` at the
root and `herdr-plugin/plugin.mjs`, which only finds the built agent and runs its `start`,
`stop` or `status`. The background lifecycle itself is an agent L3 adapter
(`L3_periphery/background`).

### What is forbidden, and what enforces it

| Rule                                                                                         | Enforced by                              |
| -------------------------------------------------------------------------------------------- | ---------------------------------------- |
| L1 imports no other layer.                                                                   | ESLint `import-x/no-restricted-paths`    |
| L2 imports only L1.                                                                          | ESLint `import-x/no-restricted-paths`    |
| L3 never imports LR or a composition root.                                                   | ESLint `import-x/no-restricted-paths`    |
| LR never imports L3. Adapters reach the view as ports, from the composition root.            | ESLint `import-x/no-restricted-paths`    |
| L1 and L2 import no `node:*`, `ws`, `fs`, `path`, `os`, `crypto`, `child_process`.           | ESLint `no-restricted-imports`           |
| L1 and L2 touch no `window`, `document`, `localStorage`, `WebSocket`, `Buffer`, `process`, … | ESLint `no-restricted-globals`           |
| No import cycles.                                                                            | ESLint `import-x/no-cycle`               |
| No floating or misused promises.                                                             | typescript-eslint `strictTypeChecked`    |
| Behaviour of each layer stays covered.                                                       | Vitest coverage thresholds (see Testing) |

`pnpm lint` fails on any of these, and CI runs it on every pull request. Unlike a review checklist,
there are no exceptions: if a view needs something an adapter has, the adapter implements an L1
port and the composition root passes it in (see `Connect` in `app/src/L1_domain/ports`).

Rules ESLint cannot see are checked by the read-only `hexagonal-guard` subagent
(`.claude/agents/hexagonal-guard.md`) during review:

- **No pass-through services.** An L2 method that only forwards one call to a port adds a layer
  without adding a rule. Call the port directly from where the rule lives instead.
- **No same-shape mappers.** Copying a DTO into an identical domain type is noise; the protocol
  types are the domain types where the shapes agree.
- **Ports are named by what the core needs, not by the technology** (`Multiplexer`, not `Herdr`).
- **Adapters are named technology + port** (`HerdrMultiplexer`, `LanTransport`,
  `WebSocketAgentConnection`).

## Where new code goes

- A new way to reach the phone (Bluetooth, another relay): a `LinkServer` in agent `L3_periphery`.
  The relay already exists: agent `RelayTransport` dials out to `packages/relay`.
- A new rule about rooms or access codes: `RelayRoom` in relay `L2_application`; the Cloudflare
  specifics stay in relay `L3_periphery`.
- A new security scheme (pairing, E2E): a `Channel` in agent `L3_periphery`; the core never sees it.
- A new multiplexer (tmux, zellij) or agent (Codex): an adapter implementing `Multiplexer` or
  `TranscriptSource`.
- A new rule about sessions: L1 if it is pure, L2 if it needs ports.
- A new screen or control: an Angular component in `LR_render`, with its state and rules in the app
  `Store`. Angular stays out of L1 and L2; ESLint refuses `@angular/*` and `rxjs` there.

## Testing

Tests live in `packages/<pkg>/test/`, mirror the `src/` layer folders, and are named `*.spec.ts`.

- L1 and L2 are tested with plain fakes of the ports (small classes, no mocking library).
- L3 adapters are tested against real temporary files, real sockets on port 0 and recorded
  command output; never against the user's live Herdr.
- LR is checked in a real browser before release; it is excluded from coverage.

Coverage thresholds are enforced by `vitest.config.ts`; `pnpm test:coverage` fails below them.
