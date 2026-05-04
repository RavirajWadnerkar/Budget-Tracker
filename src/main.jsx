import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { WorkspaceProvider } from './context/WorkspaceContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <WorkspaceProvider>
            <App />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3000,
                className:
                  '!bg-white dark:!bg-ink-900 !text-ink-900 dark:!text-ink-100 !border !border-ink-100 dark:!border-ink-800 !rounded-xl !shadow-soft',
                style: { fontSize: 14 },
              }}
            />
          </WorkspaceProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>,
);
