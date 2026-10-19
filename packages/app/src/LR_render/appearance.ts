// Theme, accent, text size and typeface, remembered per phone. The store decides and saves them;
// this file only paints them and builds their controls.

import { DEFAULT_PALETTE, PALETTES } from '../L1_domain/palette';
import { isDark, THEME_KEY, THEMES, themeChoice, type ThemeChoice } from '../L1_domain/theme';
import type { Store } from '../L2_application/app.store';
import { TEXT_SIZE_KEY, TEXT_SIZES, textSize, textSizePx } from '../L1_domain/text-size';
import {
  TYPEFACE_KEY,
  TYPEFACES,
  typefaceChoice,
  type TypefaceChoice,
} from '../L1_domain/typeface';
import { $ } from './dom';

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

function paintTextSize(step: number): void {
  document.documentElement.style.setProperty('--chat', textSizePx(step));
}

function paintTypeface(typeface: TypefaceChoice): void {
  if (typeface === 'normal') delete document.documentElement.dataset['typeface'];
  else document.documentElement.dataset['typeface'] = typeface;
}

// Like the theme: painted as the bundle loads so the first render is already in the right size
// and family. Only read here: the store saves.
paintTextSize(textSize(localStorage.getItem(TEXT_SIZE_KEY)));
paintTypeface(typefaceChoice(localStorage.getItem(TYPEFACE_KEY)));

/** Paints the text size and typeface the store holds and marks the picked options. */
export function drawTypography(step: number, typeface: TypefaceChoice): void {
  paintTextSize(step);
  paintTypeface(typeface);
  for (const option of $('sizes').children) {
    option.classList.toggle('on', (option as HTMLElement).dataset['size'] === String(step));
  }
  for (const option of $('typefaces').children) {
    option.classList.toggle('on', (option as HTMLElement).dataset['typeface'] === typeface);
  }
}

/** Builds the text size and typeface options, each handing its pick to the store, and paints. */
export function startTypography(store: Store): void {
  for (const size of TEXT_SIZES) {
    const option = document.createElement('button');
    option.dataset['size'] = String(size.step);
    option.textContent = size.label;
    option.addEventListener('click', () => {
      store.setTextSize(size.step);
    });
    $('sizes').append(option);
  }
  for (const typeface of TYPEFACES) {
    const option = document.createElement('button');
    option.dataset['typeface'] = typeface.id;
    option.textContent = typeface.label;
    option.addEventListener('click', () => {
      store.setTypeface(typeface.id);
    });
    $('typefaces').append(option);
  }
  drawTypography(store.state.textSize, store.state.typeface);
}

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
