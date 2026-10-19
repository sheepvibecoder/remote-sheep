// Theme, accent and text size, remembered per phone. The accent lives in the store; the theme and
// the size are still kept here.

import { DEFAULT_PALETTE, PALETTES } from '../L1_domain/palette';
import type { Store } from '../L2_application/app.store';
import { $, must } from './dom';

const SIZES = ['15px', '17px', '20px', '23px'];

function applyTheme(name: string): void {
  document.documentElement.dataset['theme'] = name;
  localStorage.setItem('theme', name);
  const meta = document.querySelector<HTMLMetaElement>('meta[name=theme-color]');
  if (meta) meta.content = name === 'dark' ? '#262624' : '#faf9f5';
  $('theme-value').textContent = name === 'dark' ? 'Dark' : 'Light';
}

function flipTheme(): void {
  applyTheme(document.documentElement.dataset['theme'] === 'dark' ? 'light' : 'dark');
}
$('toggle-theme').addEventListener('click', flipTheme);
// The moon at the top of a wide window's list does the same.
$('side-theme').addEventListener('click', flipTheme);
applyTheme(localStorage.getItem('theme') || 'light');

let sizeStep = Number(localStorage.getItem('size') || 1) % SIZES.length;

function applySize(): void {
  document.documentElement.style.setProperty('--chat', must(SIZES[sizeStep], 'text size'));
  localStorage.setItem('size', String(sizeStep));
  $('size-value').textContent = 'A' + '+'.repeat(sizeStep);
}

$('toggle-size').addEventListener('click', () => {
  sizeStep = (sizeStep + 1) % SIZES.length;
  applySize();
});
applySize();

/** Paints the accent the store holds and marks its swatch. */
export function drawPalette(id: string): void {
  if (id === DEFAULT_PALETTE) delete document.documentElement.dataset['palette'];
  else document.documentElement.dataset['palette'] = id;
  for (const swatch of $('swatches').children) {
    swatch.classList.toggle('on', (swatch as HTMLElement).dataset['palette'] === id);
  }
}

/** Builds the swatches, each handing its pick to the store, and paints the current accent. */
export function startPalette(store: Store): void {
  for (const palette of PALETTES) {
    const swatch = document.createElement('button');
    swatch.dataset['palette'] = palette.id;
    swatch.style.background = palette.color;
    swatch.title = palette.label;
    swatch.setAttribute('aria-label', palette.label);
    swatch.addEventListener('click', () => {
      store.setPalette(palette.id);
    });
    $('swatches').append(swatch);
  }
  drawPalette(store.state.palette);
}
