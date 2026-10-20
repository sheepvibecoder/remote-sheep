# Coding style

Formatting is not a matter of taste here: Prettier (`.prettierrc.json`) formats every file, ESLint
(`eslint.config.mjs`) checks the rest, and the pre-commit hook runs both on staged files.

## Naming

| Thing                         | Convention                                                 | Example                                   |
| ----------------------------- | ---------------------------------------------------------- | ----------------------------------------- |
| Files and folders             | kebab-case                                                 | `session-monitor.ts`, `claude/`           |
| Layer folders                 | `L1_domain`, `L2_application`, `L3_periphery`, `LR_render` | —                                         |
| Classes, interfaces, types    | PascalCase, no `I` prefix                                  | `SessionHub`, `Multiplexer`               |
| Functions, variables, methods | camelCase                                                  | `hasSettled`, `listSessions`              |
| Module constants              | SCREAMING_SNAKE_CASE                                       | `MAX_HELLO_BYTES`                         |
| Adapters                      | technology + port                                          | `HerdrMultiplexer`, `SecureChannel`       |
| Stores and views              | role suffix in the file name                               | `app.store.ts`, `app.view.ts`             |
| Tests                         | `<file under test>.spec.ts`, mirrored path                 | `test/L2_application/session-hub.spec.ts` |
| Intentionally unused          | leading underscore                                         | `_connection`                             |

One exported class per file. A file named after its main export.

## TypeScript

- `strict`, `noUncheckedIndexedAccess`, `noPropertyAccessFromIndexSignature`, `noImplicitOverride`,
  `noImplicitReturns`, `noFallthroughCasesInSwitch` are on and stay on.
- No `any`. Values from the network are `unknown` until a validator in `protocol` narrows them.
- No non-null assertions (`!`) outside tests; narrow with a check that throws a clear error.
- `null` for "deliberately absent", `undefined` only where a platform API gives it.
- Every promise is awaited, returned, or explicitly discarded with `void` next to a comment that
  says why nothing waits for it.
- `readonly` for fields that never change after construction.

## Comments

Code says what; comments say **why** — the constraint, the incident, the trade-off that is not
visible in the code. No comments that restate the line below them. Module headers explain the
role of the file in one short paragraph.

## Language

Code, identifiers, comments, logs, docs and commit messages are in English. The phone UI copy is
in English, and so are the defaults a phone starts with: the quick replies, the reply-style
suffixes and the attached-photo phrase (`app/src/L1_domain`). Dictation and read-aloud follow the
browser's language, with US English when it names none. A preference the person saved is kept as
written, in whatever language.

## Commits

[Conventional Commits](https://www.conventionalcommits.org), checked by commitlint on `commit-msg`:

```
<type>(<scope>): <imperative subject, no final period>

<body: why, wrapped at 100 columns>
```

- Types: `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `build`, `ci`, `chore`, `style`, `revert`.
- Scopes: `protocol`, `agent`, `app`, `relay`, `ci`, `deps`, `docs`, `odd`, `repo` — or none for a change
  that spans the repository.
- One purpose per commit.
