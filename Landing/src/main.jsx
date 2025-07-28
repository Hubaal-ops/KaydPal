import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { lightTheme, darkTheme } from './theme';
import App from './App.jsx';
import './index.css';

const root = createRoot(document.getElementById('root'));

// Initial theme - can be loaded from localStorage or context
const initialTheme = 'light';
const theme = initialTheme === 'dark' ? darkTheme : lightTheme;

root.render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);
