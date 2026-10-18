# Domain glossary

| Term                  | Meaning                                                                                                                                                         |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Agent**             | Two meanings, kept apart by context: the remote-sheep process on the PC (`packages/agent`), or a coding agent (Claude Code) running in a Herdr pane.            |
| **Herdr**             | The terminal multiplexer that keeps the coding agents' panes alive. Reached through its CLI.                                                                    |
| **Session**           | One coding agent in one Herdr pane, named by its **target** (the pane id). Has a status.                                                                        |
| **Space**             | A Herdr workspace. Sessions are grouped by the space they run in, and the phone can start a new session in one (`new-session`).                                 |
| **Status**            | `idle`, `working`, `blocked` (waits for an answer), `done`, `unknown` — as Herdr reports it.                                                                    |
| **Settled**           | A session that went from `working` to `done` or `blocked`: the moment worth a notification.                                                                     |
| **Transcript**        | The JSONL file where Claude Code writes the conversation; the chat the phone shows is read from it.                                                             |
| **Chat**              | The messages of one session as the phone shows them: text and images, envelopes and side chains filtered out.                                                   |
| **Console**           | A Herdr pane running a plain shell, no coding agent: a session of kind `shell`, driven through its terminal only. Off unless `REMOTE_SHEEP_SHELLS=1`.           |
| **Terminal**          | The raw pane text; the fallback for prompts that never reach the transcript (permission questions).                                                             |
| **Order**             | What the person sends a session: text, optionally with the path of an uploaded photo.                                                                           |
| **Watch**             | What a phone currently looks at (the list, a chat, or a terminal); the agent streams only that.                                                                 |
| **Link**              | A raw, ordered pipe of binary frames to one phone (a LAN socket, or one stream on the relay).                                                                   |
| **Channel**           | The layer that turns a link into an authenticated connection (a handshake with a paired phone, then sealed frames).                                             |
| **Connection**        | An authenticated phone as the core sees it.                                                                                                                     |
| **Frame**             | One message on the wire: `[u32 header length][JSON header][raw bytes]`.                                                                                         |
| **Protocol**          | The wire version (`PROTOCOL`). A phone speaking another version is closed with code 4002.                                                                       |
| **Notifier**          | Whoever must hear about a settled session when nobody is looking at it: sends a Web Push (project name and new state, no transcript) to every subscribed phone. |
| **Push subscription** | Where one phone can be reached by Web Push; kept with its paired device and dropped with it or when the push service says it is gone.                           |
| **Relay**             | A Cloudflare Worker, deployed in the owner's account, that forwards sealed frames between phone and agent so they meet outside the LAN. It reads none.          |
| **Room**              | One agent's place on the relay, named by its key id; the phones paired with that agent join it.                                                                 |
| **Access code**       | What lets an agent open a room: a code the relay owner issued (`ACCESS_CODES`). A room stays with the code that claimed it.                                     |
| **Profile**           | One computer the phone is paired with, kept on the phone by its agent key id with a name. The page shows one profile at a time; switching reloads it.           |
| **Pairing**           | (stage 2) Linking a phone to an agent by scanning a QR code, which sets up the keys for E2E encryption.                                                         |
