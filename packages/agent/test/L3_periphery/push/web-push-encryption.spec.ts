import { describe, expect, it } from 'vitest';
import { decodeBase64Url, encodeBase64Url } from '@remote-sheep/protocol';
import {
  ephemeralKeyFrom,
  encryptPayload,
} from '../../../src/L3_periphery/push/web-push-encryption';

const bytes = (text: string): Uint8Array => {
  const decoded = decodeBase64Url(text);
  if (!decoded) throw new Error('bad vector');
  return decoded;
};

// RFC 8291, Appendix A and section 5.
const AS_PRIVATE = 'yfWPiYE-n46HLnH0KqZOF1fJJU3MYrct3AELtAQ-oRw';
const AS_PUBLIC =
  'BP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A8';
const UA_PUBLIC =
  'BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4';
const AUTH_SECRET = 'BTBZMqHH6r4Tts7J_aSIgg';
const SALT = 'DGv6ra1nlYgDCS1FRnbzlw';
const BODY =
  'DGv6ra1nlYgDCS1FRnbzlwAAEABBBP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A_yl95bQpu6cVPTpK4Mqgkf1CXztLVBSt2Ks3oZwbuwXPXLWyouBWLVWGNWQexSgSxsj_Qulcy4a-fN';

describe('encryptPayload', () => {
  it('reproduces the RFC 8291 example body byte for byte', () => {
    const body = encryptPayload({
      plaintext: new TextEncoder().encode('When I grow up, I want to be a watermelon'),
      p256dh: bytes(UA_PUBLIC),
      auth: bytes(AUTH_SECRET),
      ephemeral: ephemeralKeyFrom(bytes(AS_PRIVATE), bytes(AS_PUBLIC)),
      salt: bytes(SALT),
    });
    expect(encodeBase64Url(body)).toBe(BODY);
    // 86-octet header + 41 plaintext + delimiter + 16 tag. (The RFC's sample Content-Length says
    // 145; the body it prints is 144 octets and is the one reproduced here.)
    expect(body.length).toBe(144);
  });

  it('draws a fresh salt and key for every message when none is injected', () => {
    const input = {
      plaintext: new TextEncoder().encode('x'),
      p256dh: bytes(UA_PUBLIC),
      auth: bytes(AUTH_SECRET),
    };
    expect(encodeBase64Url(encryptPayload(input))).not.toBe(encodeBase64Url(encryptPayload(input)));
  });

  it('refuses a payload that does not fit in one record', () => {
    expect(() =>
      encryptPayload({
        plaintext: new Uint8Array(4100),
        p256dh: bytes(UA_PUBLIC),
        auth: bytes(AUTH_SECRET),
      }),
    ).toThrow('too long');
  });
});
