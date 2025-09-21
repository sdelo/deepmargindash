export type Theme = {
  colors: {
    backgroundStart: string;
    backgroundEnd: string;
    amber300: string;
    amber400: string;
    cyan200: string;
    cyan300: string;
    blue700: string;
  };
  radii: {
    xl: string;
    twoXl: string;
    threeXl: string;
  };
};

export const defaultTheme: Theme = {
  colors: {
    backgroundStart: '#020617',
    backgroundEnd: '#0b1226',
    amber300: '#fcd34d',
    amber400: '#fbbf24',
    cyan200: '#a5f3fc',
    cyan300: '#67e8f9',
    blue700: '#1d4ed8',
  },
  radii: {
    xl: '0.75rem',
    twoXl: '1rem',
    threeXl: '1.5rem',
  },
};

