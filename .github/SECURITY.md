# Security

## Found a problem?

Report it **privately** through GitHub: **Security → Report a vulnerability**.
Please do not open a public issue. Only the latest version gets fixes.

## What is sensitive

- The encrypted channel between phone and computer
- Pairing by QR code
- The handshake, the frame codec and the protocol validators
- The relay

## How remote-sheep protects you

- 🔒 **End-to-end encrypted.** Every connection runs a fresh key exchange; only your phone and
  your computer hold the keys.
- ☁️ **The relay is blind.** It forwards sealed frames and cannot read them.
- 🗝️ **Secrets stay home.** Keys and paired phones live in `~/.remote-sheep`, never in the repository.
- ⏱️ **Pairings expire.** A QR code lasts 5 minutes; an unused pairing ends after 24 hours.

## Checks we run

Every release follows [docs/security-checks.md](../docs/security-checks.md). Last run before
release, October 2026:

- 🔍 **Static analysis** of the code with SonarQube and Semgrep.
- 📦 **Dependency audit** with `pnpm audit --prod` and Trivy: no known vulnerabilities.
- 🔑 **Secret scanning** with Trivy and on every commit and pull request; GitHub push protection
  refuses a push that carries a known secret.
- 🤖 **Dependabot alerts** watch the dependencies for vulnerabilities and malware after release.
- 🔬 **CodeQL** scans every push and pull request to `main`, and once a week.
- 🕷️ **Dynamic scan** of the running app with OWASP ZAP (baseline): no failures.
- 🧠 **Design review** of the encrypted channel, pairing, relay, LAN server, command execution,
  uploads and the phone app, read as an attacker would.
- 🛡️ **Browser hardening**: a strict Content-Security-Policy and anti-framing, permissions and
  cross-origin headers on every page the agent or the relay serves.

## Known limit

On the local network the app is served over plain HTTP, so the browser cannot keep the keys as
non-extractable WebCrypto keys.
