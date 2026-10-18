// Theme and text size, remembered per phone.

import { $, must } from './dom';

const SIZES = ['15px', '17px', '20px', '23px'];

function applyTheme(name: string): void {
  document.documentElement.dataset['theme'] = name;
  localStorage.setItem('theme', name);
  const meta = document.querySelector<HTMLMetaElement>('meta[name=theme-color]');
  if (meta) meta.content = name === 'dark' ? '#262624' : '#faf9f5';
  $('toggle-theme').textContent = name === 'dark' ? 'Light theme' : 'Dark theme';
}

$('toggle-theme').addEventListener('click', () => {
  applyTheme(document.documentElement.dataset['theme'] === 'dark' ? 'light' : 'dark');
});
applyTheme(localStorage.getItem('theme') || 'light');

let sizeStep = Number(localStorage.getItem('size') || 1) % SIZES.length;

function applySize(): void {
  document.documentElement.style.setProperty('--chat', must(SIZES[sizeStep], 'text size'));
  localStorage.setItem('size', String(sizeStep));
  $('toggle-size').textContent = 'Text size A' + '+'.repeat(sizeStep);
}

$('toggle-size').addEventListener('click', () => {
  sizeStep = (sizeStep + 1) % SIZES.length;
  applySize();
});
applySize();
