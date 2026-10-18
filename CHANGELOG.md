# Changelog

All notable changes to remote-sheep are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and versions follow
[Semantic Versioning](https://semver.org).

## [Unreleased]

### Added

- A Ctrl+C key in the terminal keys, to stop what runs in a console (`pnpm dev`).

### Changed

- The first step of the redesign: warm paper colours with a Watermelon accent, in light and dark;
  the Inter, Source Serif 4 and JetBrains Mono fonts, served by the agent itself; the status of a
  session shown as a ring around its avatar; **RemoteSheep** and the sheep logo at the top of the
  list, the version at the bottom of every view, and the sheep as the app icon.

## [0.6.1] — 2026-10-16

### Changed

- Consoles have a tab of their own next to **Sessions**, with a dark **$** avatar, so they are no
  longer mixed with the Claude Code sessions.

## [0.6.0] — 2026-10-16

### Added

- Consoles: plain shell panes, with no Claude Code, listed with a **$**, opened on their terminal
  and started from the **+** sheet. Off unless the agent runs with `REMOTE_SHEEP_SHELLS=1`.
- The agent reads a `.env` file in the folder it starts from; a variable set in the shell wins.
- Profiles: one phone pairs with several computers, scanning each QR inside the app, and
  switches between them with ⇄; a computer whose agent is off shows as offline.
- A notification opens the chat on the computer it came from.

## [0.5.2] — 2026-10-16

### Added

- The version shows under the title on every screen, and **⋮ → Check for updates** compares it
  with the `version.json` the build now writes, offering a reload when the server has a newer one.
- A ↓ key next to ↑ in the terminal keys.
- Android's back button returns from a chat or the devices screen to the list instead of
  closing the app.

### Changed

- The page is marked as not to be translated, so the browser stops offering Google Translate.

## [0.5.1] — 2026-10-15

### Added

- Unread badge on a session that finished or stopped to ask while its chat was not on screen;
  it survives closing the app and clears when the chat opens.
- A camera button next to the clip, which opens the camera instead of the gallery.

### Changed

- The mic uses a plain microphone icon.

### Fixed

- A second notification for the same session arrived silently; it now sounds and vibrates.

## [0.5.0] — 2026-10-15

### Added

- The phone app looks like a messaging app, in a scarlet-pink palette: settings behind a ⋮
  menu; the home lists sessions as chats with initials and a status dot, a search box, and
  Sessions / Spaces tabs; the chat has a message box with a clip, a mic that turns into send,
  and `$` for the raw terminal.
- Enter, Esc, 1, 2 and ↑ show as chips only while the session waits for an answer or the
  terminal is open; the always-on keys row is gone.
- Spaces are the Herdr workspaces; tapping one shows its sessions. The + button starts Claude
  Code in a new tab of a chosen workspace and opens its chat. Requests `spaces` and
  `new-session`; every session carries its `space`.
- `remote-sheep relay set <url> <code>`, `relay` and `relay off`: the relay is saved in
  `~/.remote-sheep/relay.json` (owner-only), so it is typed once instead of on every start. The
  environment variables still work and override it.
- `pnpm relay:deploy`: builds the app and deploys the relay in one step.

## [0.4.0] — 2026-10-15

### Added

- Relay on Cloudflare Workers (`packages/relay`): each person deploys their own; forwards
  sealed frames it cannot read; rooms per agent key, access codes in `ACCESS_CODES`, a room
  stays with the code that claimed it; serves the app over https; agent options
  `REMOTE_SHEEP_RELAY` and `REMOTE_SHEEP_RELAY_CODE`; refusals are HTTP 403 (agent) and 503
  (phone, agent offline); 4010 when the agent drops.
- Notifications by Web Push when a session goes from working to done or blocked and its chat
  is not on screen ("<project>: finished" / "<project>: waiting for your answer"); needs the
  relay's https address; on iPhone the app must be on the home screen; switch in Devices;
  requests `push-key`, `push-subscribe`, `push-unsubscribe`; VAPID keys in
  `~/.remote-sheep/vapid.json`.
- Keepalive ping every 30 s; the LAN agent answers it.
- Linked devices on the phone: list the paired phones (id, paired, last used, expires, this
  phone) and unlink any of them, applied as `remote-sheep revoke <id>`. The list is pushed to
  open phones after a pairing or an unlink. Protocol requests `devices` and `unlink`, push
  `devices`.

### Fixed

- An agent older than the app answers an unknown request with an error instead of closing the
  connection.
- Scanning a new QR on the same browser replaces its old device instead of adding one.

## [0.3.0] — 2026-10-15

### Added

- Pairing by QR: each code pairs one phone and expires after 5 minutes; Enter prints a new one.
- End-to-end encryption: a triple Diffie-Hellman handshake (X25519, HKDF-SHA256) on every
  connection and ChaCha20-Poly1305 on every frame.
- Pairings expire 24 hours after last use or 7 days after pairing; `remote-sheep devices` and
  `remote-sheep revoke <id>` manage them.

- Layered architecture (`L1_domain`, `L2_application`, `L3_periphery`, `LR_render`) enforced by
  ESLint, with type-aware lint rules, Prettier, coverage thresholds, git hooks and a CI workflow.
- Contributor docs: `CONTRIBUTING.md`, `CLAUDE.md`, `agents/`, pull request template, CODEOWNERS.

### Removed

- The shared token and `?k=` links. Protocol version 2; a phone on version 1 must reload.

## [0.2.0] — 2026-10-15

### Added

- Versioned handshake: the phone opens with `hello {protocol, token}`; another protocol version is
  closed with code 4002 and the phone asks for a reload instead of retrying.
- The phone shows when the computer cannot reach Herdr, and when it can again.
- Groundwork for notifications: a session that goes from working to done or blocked is reported to
  a notifier port.

### Changed

- Every message travels as one binary frame; photos and screenshots are raw bytes instead of
  base64 inside JSON.
- The LAN adapter only moves bytes; authentication moved to a separate channel layer.
- The phone app's state and rules moved out of the view into a tested store.

### Fixed

- The startup notice no longer claims dictation needs https.

## [0.1.0] — 2026-10-14

### Added

- First version: session list, chat from the Claude Code transcript, raw terminal, prompts and
  keys, photo upload with markup, dictation and read-aloud, over a LAN WebSocket with a shared
  token. Pushes changes instead of polling.
