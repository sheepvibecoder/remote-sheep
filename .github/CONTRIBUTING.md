# Contributing

remote-sheep is free to use but owned by its author ([LICENSE](../LICENSE)): **ask the owner before you
start**, and know that a contribution is licensed to the owner, who may relicense and sell it. Then:

## Setup

```sh
pnpm install   # also installs the git hooks
pnpm check     # what CI runs; must pass
```

The leak check needs the owner's private denylist at `~/.config/sheep-guard/denylist.txt` (or
`LEAK_DENYLIST_FILE`). It never goes in the repository.

## The rules

1. **One purpose per pull request.**
2. **Respect the layers** — see [docs/architecture.md](../docs/architecture.md). ESLint enforces them.
3. **Tests come with behaviour.** A fixed bug brings the test that reproduces it.
4. **No secrets, no personal data.** Not in code, tests, comments or screenshots.
5. **Docs change with the code.**

## What the tooling checks for you

- ✉️ Commits use your GitHub `noreply` email
- 🔍 Each commit is scanned for secrets and private data
- 🛡️ `main`, `develop` and `testing` only change through pull requests, and pushed commits are
  dated in UTC (`TZ=UTC git commit`). Merge a reviewed pull request by fast-forwarding the
  branch to it and pushing, not with GitHub's merge button, which re-dates commits in your
  timezone
- 🏛️ Each pull request gets an architecture and a leak review

## Flow

`feat/<topic>` → `develop` → `testing` → `main`, with
[Conventional Commits](https://www.conventionalcommits.org).
