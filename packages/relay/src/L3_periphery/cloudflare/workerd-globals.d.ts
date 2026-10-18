// The few workerd globals the adapters use that the DOM typings lack. @cloudflare/workers-types
// would declare them, but its TextDecoder options require `ignoreBOM`, which breaks the shared
// protocol package that builds for browsers and Node as well.

declare const WebSocketPair: new () => { 0: WebSocket; 1: WebSocket };

declare const WebSocketRequestResponsePair: new (request: string, response: string) => object;

interface ResponseInit {
  /** workerd: the client end of a pair, returned with status 101 to complete an upgrade. */
  webSocket?: WebSocket;
}
