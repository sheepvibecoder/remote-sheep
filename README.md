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

- **Your agents never wait for you** — a notification the moment one finishes or asks something;
  answer in seconds and it is back at work while you are in a meeting, on the bus or on the couch.
- **Run several sessions at once** — see them all, jump to the one that needs you, keep the rest
  going.
- **Web and phone in one install** — the same app on the PC's browser and on your phone.
- **Two steps, no setup** — install the plugin, open a link. No account, no password.
- **From anywhere, without a VPN** — a free relay in your own Cloudflare account; no Tailscale,
  no port forwarding.
- **End-to-end encrypted** — even the relay cannot read your code or your chats.
- **Voice, photos and notifications** — built for the moments you are away from the keyboard.
- **Runs itself** — starts with Herdr, picks a free port, updates from the app.

## 🚀 Get started in three steps

You need [Herdr](https://herdr.dev) 0.9.5 or newer, [Node.js](https://nodejs.org) 22+ and
[pnpm](https://pnpm.io) 11. Just updated Herdr? Restart it first: the server that was already
running keeps the old version.

**1. Install the plugin**

```sh
herdr plugin install sheepvibecoder/remote-sheep
```

Herdr downloads and builds it, which takes a few minutes.

**2. Show the pairing QR**

In Herdr, run the plugin action **Show pairing QR**, or:

```sh
herdr plugin action invoke qr --plugin sheepvibecoder.remote-sheep
```

The first time, this starts remote-sheep: Herdr starts plugins only when its server starts, so
nothing runs right after the install. From then on it starts with Herdr. The pane shows the
address, usually **http://localhost:3998**, and the QR code.

> [!TIP]
> **Nothing on http://localhost:3998?** Start it yourself, then check the port it took:
>
> ```sh
> herdr plugin action invoke start --plugin sheepvibecoder.remote-sheep
> ```
>
> `invoke` prints no result; see [If the plugin does not start](docs/guide.md#if-the-plugin-does-not-start)
> to read the port and any error.

**3. Open it**

- **On this PC:** open that address in your browser. It pairs at once — no QR, no password.
- **On your phone:** in that page, open **Settings → Add a device** and scan the QR code.

<!-- TODO: record install.gif once the repository is public.
<p align="center">
  <img src=".github/assets/install.gif" alt="Installing the plugin and pairing a phone" width="640">
</p>
-->

That's it. Updates come from the app: **Settings → Update**. Something does not work? See
[If the plugin does not start](docs/guide.md#if-the-plugin-does-not-start).

### Plugin actions

Run them from Herdr's plugin actions, or from a terminal with
`herdr plugin action invoke <action> --plugin sheepvibecoder.remote-sheep`.

| Action    | Title in Herdr       | What it does                                                     |
| --------- | -------------------- | ---------------------------------------------------------------- |
| `start`   | Start remote-sheep   | Starts the agent in the background (nothing if it already runs). |
| `stop`    | Stop remote-sheep    | Stops the agent.                                                 |
| `restart` | Restart remote-sheep | Stops and starts it again, keeping its data, port and relay.     |
| `status`  | remote-sheep status  | Says whether it runs, its port and its log file.                 |
| `qr`      | Show pairing QR      | Starts the agent if needed and shows the pairing QR and links.   |
| `relay`   | Set the relay        | Starts the agent if needed and sets or turns off the relay.      |

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
<summary><b>Commands, if you prefer the terminal</b></summary>

Every action is also a Herdr action: `start`, `stop`, `status`, `restart`, `qr` and `relay`.

```sh
herdr plugin action invoke sheepvibecoder.remote-sheep.status
```

</details>

## 📚 More

- [User guide](docs/guide.md) — every setting, the relay, running it without the plugin.
- [Architecture](docs/architecture.md) — how it is built: an Angular app, a Node agent and a
  Cloudflare relay, in TypeScript.
- [Security](.github/SECURITY.md) · [Contributing](.github/CONTRIBUTING.md)

## 📄 License

Free to use, at home or at work, under the [remote-sheep Free Use License](LICENSE). It may not be
sold or redistributed. © sheepvibecoder.
