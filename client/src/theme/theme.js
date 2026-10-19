import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0f172a', // Deep navy
      light: '#1e293b',
      dark: '#020617',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#2563eb', // Royal blue
      light: '#60a5fa',
      dark: '#1d4ed8',
      contrastText: '#ffffff',
    },
    accent: {
      main: '#0d9488', // Teal accent
      light: '#14b8a6',
      dark: '#0f766e',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    text: {
      primary: '#0f172a',
      secondary: '#64748b',
    },
    divider: '#e2e8f0',
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: {
      fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
      fontWeight: 800,
      letterSpacing: '-0.025em',
    },
    h2: {
      fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h3: {
      fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
      fontWeight: 700,
      letterSpacing: '-0.015em',
    },
    h4: {
      fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
      fontWeight: 600,
    },
    h5: {
      fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
      fontWeight: 600,
    },
    h6: {
      fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
      fontWeight: 600,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '8px 18px',
          boxShadow: 'none',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.15)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
          },
        },
        containedSecondary: {
          background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          '&:hover': {
            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 8,
        },
      },
    },
  },
});
