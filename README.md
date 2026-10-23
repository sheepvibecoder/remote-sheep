<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset=".github/assets/banner-dark.png">
    <img src=".github/assets/banner-light.png" alt="remote-sheep — Your crush leaves you on read. Your agents won't. Leave the desk. Keep shipping. remote-sheep puts your AI agents running in Herdr on your phone and in your browser. Anytime, anywhere." width="100%">
  </picture>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-0.10.2-7c3aed?style=flat-square" alt="version 0.10.2">
  <img src="https://img.shields.io/badge/Herdr-plugin-22c55e?style=flat-square" alt="Herdr plugin">
  <img src="https://img.shields.io/badge/web%20%2B%20phone-PWA-7c3aed?style=flat-square" alt="web and phone PWA">
  <img src="https://img.shields.io/badge/TypeScript-3178c6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Angular-dd0031?style=flat-square&logo=angular&logoColor=white" alt="Angular">
  <img src="https://img.shields.io/badge/Cloudflare-f38020?style=flat-square&logo=cloudflare&logoColor=white" alt="Cloudflare">
  <img src="https://img.shields.io/badge/E2E-encrypted-10b981?style=flat-square" alt="end-to-end encrypted">
  <img src="https://img.shields.io/badge/license-free%20to%20use-0ea5e9?style=flat-square" alt="free to use">
</p>

<p align="center">
  <img src=".github/assets/demo-duo.gif" alt="A session finishes in the PC browser, the phone gets a notification, the reply is dictated on the phone and appears on both screens at once" width="100%">
</p>

## ⚙️ How it works

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset=".github/assets/how-it-works-dark.png">
    <img src=".github/assets/how-it-works-light.png" alt="How remote-sheep works: your PC runs Herdr and your AI agents; it reaches your browser and your phone directly on your home network (LAN), or from anywhere through your own Cloudflare relay. Everything is end-to-end encrypted and the relay reads nothing. Features: notifications when an agent finishes or asks, chat like a messenger, voice dictation and read aloud, mark up photos and screenshots, installs as an app (PWA), several sessions at once." width="100%">
  </picture>
</p>

## 🐑 Why remote-sheep

- **Your agents never wait for you** — a notification the moment one finishes or asks something.
- **Several sessions at once** — see them all, jump to the one that needs you.
- **Web and phone in one install** — the same app on the PC's browser and on your phone.
- **From anywhere, without a VPN** — an optional free relay in your own Cloudflare account.
- **End-to-end encrypted** — even the relay cannot read your code or your chats.

## ✅ Requirements

| You need                            | Check it with     | You should see                                     |
| ----------------------------------- | ----------------- | -------------------------------------------------- |
| [Node.js](https://nodejs.org) 22+   | `node --version`  | `v22…` or higher                                   |
| [Herdr](https://herdr.dev) 0.9.5+   | `herdr --version` | `0.9.5` or higher                                  |
| [Git](https://git-scm.com)          | `git --version`   | any version                                        |
| A phone on the same Wi-Fi as the PC | —                 | (or [the relay](#-use-it-away-from-home-optional)) |

`node` and `git` must work in the terminal Herdr starts from: Herdr uses Git to download the
plugin, and Node to run it. You do **not** need pnpm or npm, and nothing is built.

Just updated Herdr? Restart it first. The server that was already running keeps the old version.

## 🚀 Install

**1. Install the plugin**

```sh
herdr plugin install sheepvibecoder/remote-sheep
```

You will see: Herdr downloads the plugin, shows a preview of it and the commands it will run, and
asks you to confirm. Confirm. There is no build step, so it ends right after.

Nothing is running yet. That is normal: Herdr starts plugins only when its server starts. Step 2
starts it for you.

**2. Show the pairing QR**

In Herdr, run the plugin action **Show pairing QR**. A pane opens over the screen. It starts
remote-sheep if needed, then shows a QR code and, below it:

```text
Scan this QR code with the phone, or open a link below in a browser, to pair it.
It pairs one phone or browser and expires at <date> <time>.
On this network:
  http://<this-pc-ip>:3998/#pair=…
On this PC's browser:
  http://127.0.0.1:3998/#pair=…
Enter: a new QR code (the previous one stops working). q or Esc: close.
```

Your address and time will differ. The port is usually 3998, or the next free one.

**3. Pair your phone and this PC**

- **Phone:** scan the QR code with the camera and open the link. Each QR pairs one device; press
  **Enter** in the pane for a new one.
- **This PC:** open the **On this PC's browser** link.

Then press **q** to close the pane. remote-sheep keeps running. From now on it starts by itself
every time Herdr starts.

**4. Check that it runs (optional)**

Run the plugin action **remote-sheep status**. Its answer goes to Herdr's plugin log (see
[how to read it](docs/guide.md#if-the-plugin-does-not-start)). You will find:

```text
remote-sheep is running: PID 12345, port 3998, log <folder>/agent.log.
```

Updates come from the app: **Settings → Update**.

### Plugin actions

In Herdr's plugin actions, or `herdr plugin action invoke <action> --plugin sheepvibecoder.remote-sheep`
(which prints nothing; the answer goes to the plugin log).

| Action    | Title in Herdr       | What it does                                           | Its answer                                       |
| --------- | -------------------- | ------------------------------------------------------ | ------------------------------------------------ |
| `start`   | Start remote-sheep   | Starts it in the background.                           | `remote-sheep started: PID …, port …, log ….`    |
| `stop`    | Stop remote-sheep    | Stops it.                                              | `remote-sheep stopped (PID …).`                  |
| `restart` | Restart remote-sheep | Stops and starts it, keeping its data, port and relay. | —                                                |
| `status`  | remote-sheep status  | Says whether it runs.                                  | `remote-sheep is running: PID …, port …, log ….` |
| `qr`      | Show pairing QR      | Opens the pairing pane (step 2).                       | —                                                |
| `relay`   | Set the relay        | Opens a pane to set or turn off the relay.             | —                                                |

If it already runs, `start` answers `remote-sheep already runs: PID …, port …, log ….`

## 🌍 Use it away from home (optional)

On your home network it just works. To reach your PC from anywhere, deploy your own relay: a free
Cloudflare Worker that forwards end-to-end encrypted messages and can read none of them.

```sh
git clone https://github.com/sheepvibecoder/remote-sheep && cd remote-sheep
pnpm install
cd packages/relay && npx wrangler login && npx wrangler secret put ACCESS_CODES && cd ../..
pnpm relay:deploy
```

Then open **Settings → Relay** in the app and paste the relay's address and your access code. The
PC connects at once, and new QR codes pair phones through the relay. Step by step:
[docs/guide.md](docs/guide.md#relay).

## 🔒 Private by design

- Browser, phone and PC talk **end-to-end encrypted**; the relay only forwards sealed messages.
- **No account, no cloud of ours:** everything runs on your PC and, if you want it, your own
  Cloudflare account.
- Only a browser **on your own PC** pairs without a QR; anyone else needs the QR you show them.

## ❓ Troubleshooting

<details>
<summary><b>I never see the Herdr notification (Windows)</b></summary>

Send Herdr's notifications to Windows: add this to `%APPDATA%\herdr\config.toml`, then run
`herdr server reload-config`. They appear in the Windows notification center (as a banner unless
Do not disturb is on).

```toml
[ui.toast]
delivery = "system"
```

</details>

<details>
<summary><b>Port 3998 is already used</b></summary>

Nothing to do: remote-sheep takes the next free port, remembers it, and the notification shows
the right address. To pick another one, open **Settings → Port**.

</details>

<details>
<summary><b>`failed to start: program not found`</b></summary>

**Why:** you have a release older than 0.11.0. Those ran pnpm during the install, and Herdr could
not find it.

**What to do:** update the plugin. Since 0.11.0 it needs only Node. Check that `node --version`
works in the terminal Herdr starts from.

```sh
herdr plugin update sheepvibecoder.remote-sheep
```

</details>

<details>
<summary><b>pnpm fails with <code>os error 183</code> in the pnpm store</b></summary>

**Why:** also a release older than 0.11.0. An earlier install left the pnpm store half written.

**What to do:** update the plugin as above; it no longer runs pnpm. To clean the store anyway, run
`pnpm store prune`.

</details>

<details>
<summary><b><code>plugin_manifest_unavailable</code></b></summary>

**Why:** Herdr knows the plugin but cannot read its `herdr-plugin.toml`. Usually your Herdr is
older than 0.9.5. Restarting Herdr alone does not fix it.

**What to do:**

1. Run `herdr plugin list --json`. In the remote-sheep entry, `warnings` says
   `manifest unavailable: <reason>`.
2. Update Herdr to 0.9.5 or newer, and restart it.
3. Install the plugin again.

</details>

## 📚 More

- [User guide](docs/guide.md) — every setting, the relay, running it without the plugin.
- [Architecture](docs/architecture.md) — how it is built: an Angular app, a Node agent and a
  Cloudflare relay, in TypeScript.
- [Security](.github/SECURITY.md) · [Contributing](.github/CONTRIBUTING.md)

## 📄 License

Free to use, at home or at work, under the [remote-sheep Free Use License](LICENSE). It may not be
sold or redistributed. © sheepvibecoder.
