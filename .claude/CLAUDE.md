# remote-sheep — notes for AI agents

Drive the coding agents running in Herdr from your phone, by chat and voice. A pnpm monorepo:
`packages/protocol` (wire contract), `packages/agent` (Node process next to Herdr),
`packages/app` (phone PWA, Vite, no framework), `packages/relay` (Cloudflare Worker relay).

## Read before changing code

- @../docs/architecture.md — the four layers and what may import what.
- @../docs/coding-style.md — naming, TypeScript rules, comments, commits.
- @../docs/glossary.md — the vocabulary (session, target, transcript, link, channel…).
- @../.github/CONTRIBUTING.md — the rules a change must meet.

## Commands

| Command          | What it does                                               |
| ---------------- | ---------------------------------------------------------- |
| `pnpm check`     | Everything CI runs. Must pass before you report work done. |
| `pnpm test`      | Vitest, all packages.                                      |
| `pnpm lint`      | ESLint, including layer boundaries. 0 errors, 0 warnings.  |
| `pnpm typecheck` | `tsc` per package.                                         |
| `pnpm format`    | Prettier, whole repository.                                |
| `pnpm build`     | App, then agent bundle with the app inside.                |
| `pnpm start`     | Runs the built agent; prints the phone URL.                |

## Inviolable

- Never send `prompt` or `keys` to the user's live Herdr sessions while testing, and never stop the
  agent the user runs on port 3999. Use another port and `REMOTE_SHEEP_HOME` pointing at a scratch
  folder.
- Never silence ESLint (`eslint-disable`) or loosen `tsconfig` to make a change pass.
- Never commit secrets, uploads or anything from `~/.remote-sheep`.
- The phone UI is a placeholder that will be redesigned: keep logic in `L2_application`, keep
  `LR_render` thin, and do not polish visuals.

## Subagents

- `hexagonal-guard` (read-only): review a change for the architecture rules ESLint cannot see.
  Run it for any change to `L1_domain`, `L2_application`, a port, or a new adapter.

## Planning notes

Feature logs live in `odd/tasks/<feature>.md`, local and ignored by git: specs quoted from the request, tasks, and a log of
decisions and evidence.
