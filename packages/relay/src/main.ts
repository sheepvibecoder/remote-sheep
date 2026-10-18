// Composition root of the Worker: the entry point workerd loads and the Durable Object class.

import { RelayDurableObject } from './L3_periphery/cloudflare/relay-durable-object';
import { handleWorkerRequest, type WorkerEnv } from './L3_periphery/cloudflare/relay-worker';

export { RelayDurableObject };

export default {
  fetch: (request: Request, env: WorkerEnv) => handleWorkerRequest(request, env),
};
