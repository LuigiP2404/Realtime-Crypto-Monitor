import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AlertProvider } from './components/AlertProvider/AlertProvider.tsx'
import theme from './theme';
import { ThemeProvider } from '@mui/material/styles';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <AlertProvider>
        <App />
      </AlertProvider>
    </ThemeProvider>
  </StrictMode>,
)
