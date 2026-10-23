# Security checks before a release

remote-sheep lets a phone drive a computer, so every release goes through the same checks. Run
them on the release branch, from the repository root, in PowerShell. A check that finds something
blocks the release until it is fixed or written down as a known limit in
[`.github/SECURITY.md`](../.github/SECURITY.md).

Record what you ran in the "Checks we run" section of `.github/SECURITY.md`. Never write unfixed
weaknesses there: the file is public.

## Every release

| #   | Check                                  | Passes when                                        |
| --- | -------------------------------------- | -------------------------------------------------- |
| 1   | `pnpm check`, then `pnpm bundle:check` | exit 0                                             |
| 2   | Dependency audit                       | no HIGH or CRITICAL with a fixed version available |
| 3   | Static analysis                        | no new findings in SonarQube or Semgrep            |
| 4   | Dynamic scan (ZAP)                     | 0 FAIL, no new WARN                                |
| 5   | Phone check                            | the app loads and works on a real phone, no errors |
| 6   | GitHub security alerts                 | no open Dependabot or code scanning alert          |

### 1. Checks and the committed bundle

`pnpm check` is what CI runs. `pnpm bundle:check` builds again and fails when
`packages/agent/dist` differs from what is committed: the Herdr plugin runs that bundle as it is,
with no build on the user's computer, so a stale one ships old code. When it fails, commit the
fresh `packages/agent/dist` and run it again. CI runs the same check after its build.

### 2. Dependency audit

```powershell
pnpm audit --prod
docker run --rm -v ${PWD}:/src aquasec/trivy fs --severity HIGH,CRITICAL /src
```

The agent bundles `ws` and `qrcode` into `packages/agent/dist`, so they are devDependencies
that still ship: `pnpm audit --prod` does not list them. Check them with `pnpm audit` (every
dependency) and treat a finding in either one as a production finding.

Trivy also reports secrets written into files by mistake. To fix a vulnerable dependency, update
it (`pnpm update <name>`), or add a `pnpm.overrides` entry when it comes in through another
package.

### 3. Static analysis

Run the SonarQube scan as usual, then Semgrep:

```powershell
docker run --rm -v ${PWD}:/src semgrep/semgrep semgrep scan --config p/typescript --config p/nodejs /src
```

### 4. Dynamic scan (ZAP)

Start a test agent on another port with a scratch home, so the agent you use every day and your
paired phones are not touched:

```powershell
# Terminal 1
$env:PORT="3997"; $env:REMOTE_SHEEP_HOME="$env:TEMP\sheep-zap"; pnpm build; pnpm start

# Terminal 2
docker run --rm -t zaproxy/zap-stable zap-baseline.py -t http://host.docker.internal:3997
```

Expected warnings, not to fix: Non-Storable Content, Timestamp Disclosure, Modern Web Application
and CSP: Wildcard Directive (the relay's address is chosen at runtime, so `connect-src` must allow
any `ws:`/`wss:`). Stop the test agent when done.

### 5. Phone check

Open the built app on a real phone, over the LAN and through the relay. The browser console must
show no `Refused to …` (Content-Security-Policy) errors. Check this after every Angular upgrade:
the policy allows no inline script, so a build that adds one leaves the page broken.

## When a sensitive part changes

Repeat the design review, read as an attacker would, for the parts the release changed:

- the encrypted channel, the handshake and pairing;
- the relay (rooms, access codes, connection limits);
- the LAN server (what answers before the handshake, the Origin check);
- anything that runs a command or writes a file from a phone request;
- how the phone app renders chat, terminal text and images.
