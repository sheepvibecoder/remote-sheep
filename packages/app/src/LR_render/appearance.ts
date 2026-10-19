// Theme, accent and text size, remembered per phone. The theme and the accent live in the store;
// the size is still kept here.

import { DEFAULT_PALETTE, PALETTES } from '../L1_domain/palette';
import { isDark, THEME_KEY, THEMES, themeChoice, type ThemeChoice } from '../L1_domain/theme';
import type { Store } from '../L2_application/app.store';
import { $, must } from './dom';

const SIZES = ['15px', '17px', '20px', '23px'];

const deviceDark = matchMedia('(prefers-color-scheme: dark)');

function paintTheme(dark: boolean): void {
  document.documentElement.dataset['theme'] = dark ? 'dark' : 'light';
  const meta = document.querySelector<HTMLMetaElement>('meta[name=theme-color]');
  if (meta) meta.content = dark ? '#262624' : '#faf9f5';
}

// The store starts only after Angular's first render; painting the stored theme now, as the
// bundle loads, keeps a dark phone from flashing light first. Only read here: the store saves.
paintTheme(isDark(themeChoice(localStorage.getItem(THEME_KEY)), deviceDark.matches));

/** Paints the theme the store decided and marks the picked option. */
export function drawTheme(theme: ThemeChoice, dark: boolean): void {
  paintTheme(dark);
  for (const option of $('themes').children) {
    option.classList.toggle('on', (option as HTMLElement).dataset['theme'] === theme);
  }
}

/** Builds the theme options, hands the store the device's preference as it changes, and paints. */
export function startTheme(store: Store): void {
  for (const theme of THEMES) {
    const option = document.createElement('button');
    option.dataset['theme'] = theme.id;
    option.textContent = theme.label;
    option.addEventListener('click', () => {
      store.setTheme(theme.id);
    });
    $('themes').append(option);
  }
  // The moon at the top of a wide window's list flips to the other of Light and Dark.
  $('side-theme').addEventListener('click', () => {
    store.toggleTheme();
  });
  deviceDark.addEventListener('change', () => {
    store.setDeviceDark(deviceDark.matches);
  });
  store.setDeviceDark(deviceDark.matches);
  drawTheme(store.state.theme, store.state.dark);
}

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
