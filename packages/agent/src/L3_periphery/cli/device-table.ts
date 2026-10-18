// What `remote-sheep devices` prints.

import { isPairingExpired, pairingExpiresAt } from '../../L1_domain/pairing-expiry';
import type { Device } from '../../L1_domain/ports/device-registry';

const pad = (n: number) => String(n).padStart(2, '0');

/** Local `YYYY-MM-DD HH:MM`: the person reads it next to their own clock. */
export function formatTime(ms: number): string {
  const d = new Date(ms);
  return (
    `${String(d.getFullYear())}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

export function formatDevices(devices: readonly Device[], now: number): string {
  if (!devices.length) {
    return 'No paired phones. Run `remote-sheep` and scan its QR code to pair one.';
  }
  const header = ['ID', 'PAIRED', 'LAST USED', 'EXPIRES'];
  const rows = [
    header,
    ...devices.map((device) => [
      device.id,
      formatTime(device.pairedAt),
      formatTime(device.lastSeen),
      isPairingExpired(device, now) ? 'expired' : formatTime(pairingExpiresAt(device)),
    ]),
  ];
  const widths = header.map((_, column) =>
    Math.max(...rows.map((row) => (row[column] ?? '').length)),
  );
  return rows
    .map((row) =>
      row
        .map((cell, column) => cell.padEnd(widths[column] ?? 0))
        .join('  ')
        .trimEnd(),
    )
    .join('\n');
}
