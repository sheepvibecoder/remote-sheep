## What and why

<!-- One purpose per pull request. What changes for the person using remote-sheep, and why. -->

## How it was verified

- [ ] `pnpm check` passes (format, lint, typecheck, tests with coverage, build)
- [ ] New behaviour has a test that fails without it
- [ ] Checked by hand on a phone, if the view or the connection changed

## Architecture

- [ ] No logic added to `L3_periphery` or `LR_render` that belongs in L1/L2
- [ ] `hexagonal-guard` run for changes to L1/L2, a port or a new adapter — verdict:
- [ ] Docs (`README.md`, `docs/`) updated if a command, option, message or rule changed

## Risk

<!-- What could break, and for whom. Security-relevant (channel, token, codec, validators)? -->
