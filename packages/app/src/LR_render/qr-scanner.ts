// The in-app QR scanner, so a second computer can be added from the installed app
// instead of the phone's camera app (which would open the page in another browser).
//
// It uses the browser's BarcodeDetector: Chrome on Android has it, and it needs no
// library. The camera works only on a secure page, which the relay is.

import { $ } from './dom';

/** BarcodeDetector is not in TypeScript's DOM types yet. */
interface Detector {
  detect(source: HTMLVideoElement): Promise<{ rawValue: string }[]>;
}
type DetectorClass = new (options: { formats: string[] }) => Detector;

const SCAN_EVERY_MS = 300;

const overlay = $('scanner');
const video = $('scanner-video', HTMLVideoElement);
const cancel = $('scanner-cancel');

function detectorClass(): DetectorClass | null {
  const found = (window as unknown as { BarcodeDetector?: DetectorClass }).BarcodeDetector;
  return found ?? null;
}

/** Whether this browser can scan here; the page hides the button otherwise. */
export function canScan(): boolean {
  return detectorClass() !== null && isSecureContext && 'mediaDevices' in navigator;
}

/** Opens the camera full screen and resolves with the first QR code's text, or null if cancelled. */
export async function scanQr(): Promise<string | null> {
  const Detector = detectorClass();
  if (!Detector) throw new Error('this browser cannot scan QR codes');
  const detector = new Detector({ formats: ['qr_code'] });
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'environment' },
    audio: false,
  });
  video.srcObject = stream;
  overlay.classList.remove('hidden');
  await video.play();
  return new Promise((resolve) => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const finish = (value: string | null) => {
      if (timer) clearTimeout(timer);
      timer = null;
      cancel.removeEventListener('click', onCancel);
      for (const track of stream.getTracks()) track.stop();
      video.srcObject = null;
      overlay.classList.add('hidden');
      resolve(value);
    };
    const onCancel = () => {
      finish(null);
    };
    const look = async () => {
      timer = null;
      try {
        const [code] = await detector.detect(video);
        if (code) {
          finish(code.rawValue);
          return;
        }
      } catch {
        // A frame the detector could not read; the next one may do.
      }
      // look() handles its own failures; the timer has nothing to wait for.
      if (!overlay.classList.contains('hidden'))
        timer = setTimeout(() => void look(), SCAN_EVERY_MS);
    };
    cancel.addEventListener('click', onCancel);
    // look() handles its own failures and reschedules itself.
    void look();
  });
}
