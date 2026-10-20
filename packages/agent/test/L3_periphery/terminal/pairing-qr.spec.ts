import { describe, expect, it } from 'vitest';
import { renderQr } from '../../../src/L3_periphery/terminal/pairing-qr';

describe('renderQr', () => {
  it('draws the text as a QR code made of terminal blocks', async () => {
    const qr = await renderQr('http://192.168.1.20:3999/#pair=abc');
    const lines = qr.trim().split('\n');
    expect(lines.length).toBeGreaterThan(10);
    expect(qr).toMatch(/[█▀▄]/);
  });
});
