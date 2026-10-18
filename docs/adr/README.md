# Architecture decisions

Short records of the decisions that shape remote-sheep: what was decided, and why.

| #                                                | Decision                                        |
| ------------------------------------------------ | ----------------------------------------------- |
| [0001](0001-fresh-history-no-personal-data.md)   | The repository starts with a fresh history      |
| [0002](0002-secrets-live-outside-the-repo.md)    | Secrets live outside the repository             |
| [0003](0003-commit-identity-noreply-enforced.md) | Commits use a GitHub noreply email, enforced    |
| [0004](0004-leak-scanning-on-every-change.md)    | Every change is scanned for leaks               |
| [0005](0005-relay-reads-nothing.md)              | The relay forwards sealed frames and reads none |
| [0006](0006-proprietary-private-until-public.md) | Proprietary, private until it goes public       |
| [0007](0007-angular-for-the-phone-app.md)        | The phone app moves to Angular                  |

New decision: copy the shape of any record — **Context**, **Decision**, **Consequences** — and
take the next number. A record is never edited to say something else; a new one replaces it.
