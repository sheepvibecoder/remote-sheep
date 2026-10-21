// The HTTP security headers every response that serves the phone app carries. The LAN agent and
// the relay Worker both serve the same app, so the values live here once and cannot drift.
//
// The policy is derived from what the built app really does: it loads only its own files, its
// fonts are bundled, screenshots and photo previews are blob: URLs, the pairing QR is a data:
// SVG, and it opens WebSockets to the agent (same origin) or to the relay (another origin, set
// by the person). No inline script is allowed: Angular's `inlineCritical` is off in
// `angular.json` because it injects one into index.html, and a hash of it here would silently
// leave the app unstyled the day a build changed that script.

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  // Angular and the app set style attributes and a <style> element, so inline styles stay.
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  // The relay is another origin chosen at runtime, so any WebSocket target is allowed; fetch stays same-origin.
  "connect-src 'self' ws: wss:",
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

export const SECURITY_HEADERS: Readonly<Record<string, string>> = {
  'content-security-policy': CONTENT_SECURITY_POLICY,
  // Older browsers ignore frame-ancestors but honour this one.
  'x-frame-options': 'DENY',
  // Dictation needs the microphone and the QR scanner the camera; nothing else is used.
  'permissions-policy':
    'microphone=(self), camera=(self), geolocation=(), payment=(), usb=(), bluetooth=(), serial=(), hid=()',
  // Nothing cross-origin is embedded (the relay is only a WebSocket), so the strict value is safe.
  'cross-origin-embedder-policy': 'require-corp',
  'cross-origin-opener-policy': 'same-origin',
  // The app is only ever loaded by its own pages, never embedded by another origin.
  'cross-origin-resource-policy': 'same-origin',
};
