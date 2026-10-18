// The service worker: shows a notification when the agent pushes one, and opens the app on
// that session when it is tapped. It owns no state and caches nothing.
//
// Kept outside `src/` and self-contained on purpose: it runs in a worker (its own tsconfig,
// no DOM) and `build.mjs` bundles it alone into the classic script `sw.js`, which cannot import
// shared chunks.

const worker = self as unknown as ServiceWorkerGlobalScope;

const ICON = '/icon-192.png';

/** Options the worker's lib types do not list yet, but Chrome and Firefox honour. */
interface AlertOptions extends NotificationOptions {
  renotify?: boolean;
  vibrate?: number[];
}

interface Payload {
  title: string;
  target: string | null;
  /** The computer that sent it; agents older than profiles leave it out. */
  agent: string | null;
}

/** Browsers require every push to show a notification, so a bad payload still gets a generic one. */
function parse(event: PushEvent): Payload {
  try {
    const value: unknown = event.data?.json();
    if (typeof value === 'object' && value !== null) {
      const { title, target, agent } = value as Record<string, unknown>;
      if (typeof title === 'string' && title) {
        return {
          title,
          target: typeof target === 'string' && target ? target : null,
          agent: typeof agent === 'string' && agent ? agent : null,
        };
      }
    }
  } catch {
    // Not JSON: fall through to the generic notification.
  }
  return { title: 'remote-sheep', target: null, agent: null };
}

worker.addEventListener('push', (event) => {
  const { title, target, agent } = parse(event);
  // The tag makes a second push for the same session replace the first; the agent is
  // part of it because two computers can both have a pane `w5:pC`.
  // A replaced notification is silent unless `renotify` is set, which is why
  // a session that settled twice used to arrive without a sound.
  const options: AlertOptions = {
    icon: ICON,
    silent: false,
    vibrate: [200, 100, 200],
    ...(target && { tag: (agent ?? '') + '/' + target, renotify: true, data: { target, agent } }),
  };
  event.waitUntil(worker.registration.showNotification(title, options));
});

async function open(url: string): Promise<void> {
  const windows = await worker.clients.matchAll({ type: 'window', includeUncontrolled: true });
  const existing = windows[0];
  if (existing) {
    try {
      await existing.focus();
      await existing.navigate(url);
      return;
    } catch {
      // A window the worker cannot navigate: open a new one instead.
    }
  }
  await worker.clients.openWindow(url);
}

worker.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data as { target?: string; agent?: string | null } | null;
  // The page reads `?session=` and `&agent=` on start and opens that computer's chat.
  const query = new URLSearchParams();
  if (data?.target) query.set('session', data.target);
  if (data?.agent) query.set('agent', data.agent);
  const search = query.toString();
  const url = search ? '/?' + search : '/';
  event.waitUntil(open(url));
});

export {};
