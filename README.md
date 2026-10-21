<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset=".github/assets/banner-dark.png">
    <img src=".github/assets/banner-light.png" alt="remote-sheep — Your crush leaves you on read. Your agents won't. Leave the desk. Keep shipping. remote-sheep puts your AI agents running in Herdr on your phone and in your browser. Anytime, anywhere." width="100%">
  </picture>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Herdr-plugin-22c55e?style=flat-square" alt="Herdr plugin">
  <img src="https://img.shields.io/badge/web%20%2B%20phone-PWA-7c3aed?style=flat-square" alt="web and phone">
  <img src="https://img.shields.io/badge/E2E-encrypted-10b981?style=flat-square" alt="end-to-end encrypted">
  <img src="https://img.shields.io/badge/license-free%20to%20use-0ea5e9?style=flat-square" alt="free to use">
</p>

<p align="center">
  <img src=".github/assets/demo-web.gif" alt="Driving Claude Code from a browser" width="560">
  &nbsp;
  <img src=".github/assets/demo-phone.gif" alt="Driving Claude Code from a phone" width="220">
</p>

## ✨ One plugin, web and phone

<p align="center">
  <img src=".github/assets/desktop.png" alt="remote-sheep in a browser on the PC: sessions on the left, a chat with code on the right" width="820">
  <br><sub>💻 <b>In your browser</b> — every session and its chat, side by side, on the PC.</sub>
</p>

<table>
  <tr>
    <td align="center" width="33%">
      <img src=".github/assets/notify.png" alt="Sessions list on a phone, one waiting for an answer" width="220"><br>
      <b>🔔 Know who needs you</b><br><sub>A notification the moment a session finishes or asks something.</sub>
    </td>
    <td align="center" width="33%">
      <img src=".github/assets/chat.png" alt="A chat with Claude Code on a phone" width="220"><br>
      <b>💬 Chat like a messenger</b><br><sub>Read the reply, send the next order, keep it moving.</sub>
    </td>
    <td align="center" width="33%">
      <img src=".github/assets/voice.png" alt="Dictating an order on a phone" width="220"><br>
      <b>🎙️ Just say it</b><br><sub>Dictate orders and hear the replies read aloud.</sub>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src=".github/assets/editor.png" alt="Drawing on a screenshot in the photo editor" width="220"><br>
      <b>✏️ Mark it up</b><br><sub>Circle the bug on a photo or a screenshot before you send it.</sub>
    </td>
    <td align="center">
      <img src=".github/assets/photo.png" alt="A marked-up photo sent in a chat and the agent's fix" width="220"><br>
      <b>📸 Show, don't type</b><br><sub>Send the picture; the agent sees it and fixes it.</sub>
    </td>
    <td align="center">
      <img src=".github/assets/demo-photo.gif" alt="Marking a photo and sending it from a phone" width="220"><br>
      <b>📱 Install it like an app</b><br><sub>Add it to the home screen on Android or iPhone.</sub>
    </td>
  </tr>
</table>

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

## 🚀 Get started in two steps

You need [Herdr](https://herdr.dev) 0.9.5 or newer, [Node.js](https://nodejs.org) 22+ and
[pnpm](https://pnpm.io).

**1. Install the plugin**

```sh
herdr plugin install sheepvibecoder/remote-sheep
```

Herdr builds it and starts it in the background. A notification tells you the address:
**remote-sheep ✓ — open http://localhost:3998**.

**2. Open it**

- **On this PC:** open that address in your browser. It pairs at once — no QR, no password.
- **On your phone:** in that page, open **Settings → Add a device** and scan the QR code.

<!-- TODO: record install.gif once the repository is public.
<p align="center">
  <img src=".github/assets/install.gif" alt="Installing the plugin and pairing a phone" width="640">
</p>
-->

That's it. Updates come from the app: **Settings → Update**.

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
