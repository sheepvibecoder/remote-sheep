// Composition root: the only file that knows which adapters the app talks through.

import { agentFromSearch, sessionFromSearch } from './L1_domain/session-link';
import { HttpUpdateSource } from './L3_periphery/http-update-source';
import { IndexedDbPairingStore } from './L3_periphery/indexed-db-pairing-store';
import {
  ServiceWorkerPushSubscriptions,
  type PushEnvironment,
} from './L3_periphery/service-worker-push-subscriptions';
import { agentUrl, WebSocketAgentConnection } from './L3_periphery/websocket-agent-connection';
import { startApp } from './LR_render/app.view';

// The pairing secret must not stay in the address bar, where it lands in history.
// A tapped notification names its session in the query; that goes too once read.
const fragment = location.hash;
const session = sessionFromSearch(location.search);
const agent = agentFromSearch(location.search);
if (fragment || session || agent) history.replaceState(null, '', location.pathname);

// A QR scanned while the app is already open only changes the fragment; start over with it.
window.addEventListener('hashchange', () => {
  location.reload();
});

const pushEnvironment: PushEnvironment = {
  secure: isSecureContext,
  ios:
    /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    // iPadOS reports itself as a Mac, with a touch screen.
    (navigator.userAgent.includes('Macintosh') && navigator.maxTouchPoints > 1),
  standalone: matchMedia('(display-mode: standalone)').matches,
  hasPushManager: 'PushManager' in window,
  serviceWorker: 'serviceWorker' in navigator ? navigator.serviceWorker : null,
  notifications:
    'Notification' in window ? { request: () => Notification.requestPermission() } : null,
};

startApp({
  connect: (credentials, handlers) =>
    new WebSocketAgentConnection(agentUrl(location, credentials.agentKey), credentials, handlers),
  pairings: new IndexedDbPairingStore(indexedDB),
  fragment,
  session,
  agent,
  push: new ServiceWorkerPushSubscriptions(pushEnvironment),
  updates: new HttpUpdateSource((url, init) => fetch(url, init)),
});
