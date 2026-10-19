<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset=".github/assets/banner-dark.png">
    <img src=".github/assets/banner-light.png" alt="remote-sheep" width="100%">
  </picture>
</p>

<h3 align="center">Your coding agents, in your pocket.</h3>
<p align="center">Chat with the Claude Code sessions running in <a href="https://herdr.dev">Herdr</a> — by text, voice or photo.</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-0.8.0-7c3aed?style=flat-square" alt="version 0.8.0">
  <img src="https://img.shields.io/badge/TypeScript-3178c6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Cloudflare-f38020?style=flat-square&logo=cloudflare&logoColor=white" alt="Cloudflare">
  <img src="https://img.shields.io/badge/E2E-encrypted-10b981?style=flat-square" alt="end-to-end encrypted">
</p>

<!-- Demo GIF goes here once the new design ships:
<p align="center"><img src=".github/assets/demo.gif" alt="remote-sheep demo" width="300"></p>
-->

## ✨ Why remote-sheep

|          💬 **Chat anywhere**           |             🎙️ **Talk to it**             |          🔔 **Know when it's done**          |           🔒 **Private by design**           |
| :-------------------------------------: | :---------------------------------------: | :------------------------------------------: | :------------------------------------------: |
| Every session from Herdr, on your phone | Dictate orders, hear replies, send photos | A push the moment a session finishes or asks | End-to-end encrypted. The relay sees nothing |

## 🧭 How it works

```mermaid
flowchart LR
    phone["📱 <b>app</b><br/>phone PWA"]
    relay["☁️ <b>relay</b><br/>Cloudflare Worker"]
    agent["💻 <b>agent</b><br/>runs on your PC"]
    herdr["🐑 <b>Herdr</b><br/>Claude Code panes"]
    proto(["🧩 <b>protocol</b> · shared wire contract"])

    phone <-- "LAN · E2E" --> agent
    phone <-. "anywhere · sealed" .-> relay
    relay <-. "sealed" .-> agent
    agent --> herdr
    proto -.- phone & agent & relay

    classDef app fill:#7c3aed,stroke:#5b21b6,color:#fff
    classDef cloud fill:#f38020,stroke:#c2410c,color:#fff
    classDef pc fill:#0ea5e9,stroke:#0369a1,color:#fff
    classDef ext fill:#10b981,stroke:#047857,color:#fff
    classDef shared fill:#f1f5f9,stroke:#94a3b8,color:#334155
    class phone app
    class relay cloud
    class agent pc
    class herdr ext
    class proto shared
```

## 🚀 Quick start

Needs Node 22+ and a running Herdr.

```sh
pnpm install && pnpm build && pnpm start
```

Scan the QR with your phone. That's it.

<p align="center">
  <a href="docs/">Docs</a> ·
  <a href=".github/SECURITY.md">Security</a> ·
  <a href=".github/CONTRIBUTING.md">Contributing</a> ·
  <a href="LICENSE">License</a>
</p>
