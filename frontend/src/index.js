import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#0ea5e9',
      light: '#38bdf8',
      dark: '#0369a1'
    },
    secondary: {
      main: '#1e40af',
      light: '#3b82f6',
      dark: '#1e3a8a'
    },
    background: {
      default: '#0b0f19',
      paper: '#111827'
    }
  },
  shape: {
    borderRadius: 10
  },
  typography: {
    fontFamily: 'Inter, Roboto, Helvetica, Arial, sans-serif',
    h5: { fontWeight: 700 }
  }
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);


