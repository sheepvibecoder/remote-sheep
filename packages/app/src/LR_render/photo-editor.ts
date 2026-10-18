// Marking up a photo before it is sent.
//
// A photo of a screen is far more useful once you can point at the part that
// has to change, so the picture goes onto a canvas and the finger draws on it.

import { $, must } from './dom';

const editor = $('editor');
const canvas = $('editor-canvas', HTMLCanvasElement);
const brush = must(canvas.getContext('2d'), '2d canvas context');
// Phone cameras produce far more pixels than anyone needs here, and a smaller
// canvas also keeps the drawing smooth.
const MAX_SIDE = 1600;

interface Point {
  x: number;
  y: number;
}
interface Stroke {
  colour: string;
  width: number;
  points: Point[];
}
type Picture = ImageBitmap | HTMLImageElement;

let strokes: Stroke[] = [];
let stroking: Stroke | null = null;
let colour = localStorage.getItem('ink') || '#ff2d2d';
let source: Picture | null = null;
let finish: ((blob: Blob | null) => void) | null = null;

// createImageBitmap decodes more formats than an <img> does and applies the
// rotation a phone records in the file, so the picture is not drawn sideways.
async function readImageFile(file: File): Promise<Picture> {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      /* fall through to the img element */
    }
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () =>
      reject(
        new Error(
          'this phone saved the photo as ' +
            (file.type || 'an unknown type') +
            ', which the browser cannot open',
        ),
      );
    img.src = URL.createObjectURL(file);
  });
}

function style(stroke: Stroke): void {
  brush.strokeStyle = stroke.colour;
  brush.lineWidth = stroke.width;
  brush.lineCap = 'round';
  brush.lineJoin = 'round';
}

function paintStroke(stroke: Stroke): void {
  style(stroke);
  brush.beginPath();
  stroke.points.forEach((p, i) => (i ? brush.lineTo(p.x, p.y) : brush.moveTo(p.x, p.y)));
  brush.stroke();
}

function redraw(): void {
  if (source) brush.drawImage(source, 0, 0, canvas.width, canvas.height);
  for (const stroke of strokes) paintStroke(stroke);
}

// The canvas is shown scaled down, so a touch has to be mapped back onto it.
function at(event: PointerEvent): Point {
  const box = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - box.left) / box.width) * canvas.width,
    y: ((event.clientY - box.top) / box.height) * canvas.height,
  };
}

canvas.addEventListener('pointerdown', (event) => {
  canvas.setPointerCapture(event.pointerId);
  stroking = { colour, width: Math.max(4, Math.round(canvas.width / 160)), points: [at(event)] };
  strokes.push(stroking);
});

canvas.addEventListener('pointermove', (event) => {
  if (!stroking) return;
  stroking.points.push(at(event));
  // Drawing only the new segment keeps the stroke smooth on a phone; the full
  // redraw is left for undo and clear.
  const points = stroking.points;
  const from = must(points[points.length - 2], 'stroke start');
  const to = must(points[points.length - 1], 'stroke end');
  style(stroking);
  brush.beginPath();
  brush.moveTo(from.x, from.y);
  brush.lineTo(to.x, to.y);
  brush.stroke();
});

// Only up and cancel end a stroke. Listening for pointerleave as well cut the
// line short whenever a finger strayed past the edge of the picture.
for (const type of ['pointerup', 'pointercancel']) {
  canvas.addEventListener(type, () => {
    // A tap with no movement is a dot, which is the natural way to mark a spot.
    const point = stroking?.points.length === 1 ? stroking.points[0] : undefined;
    if (stroking && point) {
      brush.fillStyle = stroking.colour;
      brush.beginPath();
      brush.arc(point.x, point.y, stroking.width / 2, 0, Math.PI * 2);
      brush.fill();
      stroking.points.push({ x: point.x + 0.01, y: point.y });
    }
    stroking = null;
  });
}

const swatches = [...editor.querySelectorAll<HTMLButtonElement>('.swatch')];

function applyColour(): void {
  for (const swatch of swatches) {
    swatch.style.background = swatch.dataset['color'] ?? '';
    swatch.classList.toggle('on', swatch.dataset['color'] === colour);
  }
}

for (const swatch of swatches) {
  swatch.addEventListener('click', () => {
    colour = swatch.dataset['color'] ?? colour;
    localStorage.setItem('ink', colour);
    applyColour();
  });
}

$('editor-undo').addEventListener('click', () => {
  strokes.pop();
  redraw();
});

$('editor-clear').addEventListener('click', () => {
  strokes = [];
  redraw();
});

$('editor-cancel').addEventListener('click', () => close(null));

$('editor-done').addEventListener('click', () => {
  canvas.toBlob((blob) => close(blob), 'image/jpeg', 0.9);
});

function close(blob: Blob | null): void {
  editor.classList.add('hidden');
  const done = finish;
  finish = null;
  done?.(blob);
}

export function hideEditor(): void {
  editor.classList.add('hidden');
}

/** Resolves with the marked-up photo, or null when the person cancels. */
export async function markUp(file: File): Promise<Blob | null> {
  const img = await readImageFile(file);
  // An ImageBitmap reports width/height; an <img> reports naturalWidth/Height.
  const wide = 'naturalWidth' in img ? img.naturalWidth : img.width;
  const tall = 'naturalHeight' in img ? img.naturalHeight : img.height;
  if (!wide || !tall) throw new Error('that photo came back empty');

  const scale = Math.min(1, MAX_SIDE / Math.max(wide, tall));
  canvas.width = Math.round(wide * scale);
  canvas.height = Math.round(tall * scale);
  source = img;
  strokes = [];
  redraw();
  applyColour();
  editor.classList.remove('hidden');
  return new Promise((resolve) => {
    finish = resolve;
  });
}
