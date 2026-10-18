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

## Known limit

On the local network the app is served over plain HTTP, so the browser cannot keep the keys as
non-extractable WebCrypto keys.
