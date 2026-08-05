import { createTheme } from '@mui/material/styles';

const BORDER = 'rgba(255, 255, 255, 0.09)';
const BORDER_STRONG = 'rgba(255, 255, 255, 0.18)';
const ACCENT = '#7c5cff';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: ACCENT },
    error: { main: '#ff5a72' },
    success: { main: '#2ee6a8' },
    background: { default: '#06080f', paper: '#0e1220' },
    text: { primary: '#e8ecf4', secondary: '#8a94a8' },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif",
  },
  components: {
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          backgroundColor: 'rgba(255, 255, 255, 0.045)',
          transition: 'background-color 0.18s ease, box-shadow 0.18s ease',
          '& .MuiOutlinedInput-notchedOutline': { borderColor: BORDER },
          '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.07)' },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: BORDER_STRONG },
          '&.Mui-focused': {
            backgroundColor: 'rgba(255, 255, 255, 0.07)',
            boxShadow: '0 0 0 4px rgba(124, 92, 255, 0.16)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: ACCENT,
            borderWidth: 1,
          },
        },
        input: { fontSize: 14, fontWeight: 500 },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: { fontSize: 14, color: '#8a94a8' },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        paper: {
          marginTop: 8,
          backgroundColor: 'rgba(14, 18, 32, 0.96)',
          backdropFilter: 'blur(16px)',
          border: `1px solid ${BORDER}`,
          borderRadius: 16,
          boxShadow: '0 24px 60px -24px rgba(0, 0, 0, 0.95)',
        },
        listbox: {
          padding: 6,
          maxHeight: '46vh',
        },
        option: {
          borderRadius: 10,
          padding: '8px 10px',
          '&.Mui-focused, &[aria-selected="true"]': {
            backgroundColor: 'rgba(124, 92, 255, 0.16)',
          },
        },
        noOptions: { fontSize: 13, color: '#8a94a8' },
        loading: { fontSize: 13, color: '#8a94a8' },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          border: `1px solid ${BORDER}`,
          backgroundColor: 'rgba(14, 18, 32, 0.97)',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 24px 60px -24px rgba(0, 0, 0, 0.95)',
          fontSize: 14,
          alignItems: 'center',
        },
      },
    },
  },
});

export default theme;
