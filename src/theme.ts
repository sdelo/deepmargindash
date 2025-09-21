import { defaultTheme } from './types/theme';

export function applyTheme(theme = defaultTheme) {
  const root = document.documentElement;
  root.style.setProperty('--color-bg-start', theme.colors.backgroundStart);
  root.style.setProperty('--color-bg-end', theme.colors.backgroundEnd);
  root.style.setProperty('--color-amber-300', theme.colors.amber300);
  root.style.setProperty('--color-amber-400', theme.colors.amber400);
  root.style.setProperty('--color-cyan-200', theme.colors.cyan200);
  root.style.setProperty('--color-cyan-300', theme.colors.cyan300);
  if (theme.colors.rose400) root.style.setProperty('--color-rose-400', theme.colors.rose400);
  if (theme.colors.emerald400) root.style.setProperty('--color-emerald-400', theme.colors.emerald400);
  if (theme.colors.indigo400) root.style.setProperty('--color-indigo-400', theme.colors.indigo400);
  if (theme.colors.blue400) root.style.setProperty('--color-blue-400', theme.colors.blue400);
  root.style.setProperty('--color-blue-700', theme.colors.blue700);

  root.style.setProperty('--radius-xl', theme.radii.xl);
  root.style.setProperty('--radius-2xl', theme.radii.twoXl);
  root.style.setProperty('--radius-3xl', theme.radii.threeXl);
}

export const themes = {
  default: defaultTheme,
  leviathan: {
    colors: {
      backgroundStart: '#061826',
      backgroundEnd: '#0b1526',
      amber300: '#fcd34d',
      amber400: '#fbbf24',
      cyan200: '#99f6e4',
      cyan300: '#2dd4bf', // teal-400
      rose400: '#fb7185',
      emerald400: '#34d399',
      indigo400: '#6366f1',
      blue400: '#38bdf8',
      blue700: '#1d4ed8',
    },
    radii: {
      xl: '0.75rem',
      twoXl: '1rem',
      threeXl: '1.5rem',
    },
  },
} as const;

export type ThemeName = keyof typeof themes;

export function setTheme(name: ThemeName) {
  applyTheme(themes[name]);
}

