import { defaultTheme } from './types/theme';

export function applyTheme(theme = defaultTheme) {
  const root = document.documentElement;
  root.style.setProperty('--color-bg-start', theme.colors.backgroundStart);
  root.style.setProperty('--color-bg-end', theme.colors.backgroundEnd);
  root.style.setProperty('--color-amber-300', theme.colors.amber300);
  root.style.setProperty('--color-amber-400', theme.colors.amber400);
  root.style.setProperty('--color-cyan-200', theme.colors.cyan200);
  root.style.setProperty('--color-cyan-300', theme.colors.cyan300);
  root.style.setProperty('--color-blue-700', theme.colors.blue700);

  root.style.setProperty('--radius-xl', theme.radii.xl);
  root.style.setProperty('--radius-2xl', theme.radii.twoXl);
  root.style.setProperty('--radius-3xl', theme.radii.threeXl);
}

