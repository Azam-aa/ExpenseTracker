import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app/App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { appFolder } from './services/storage/appFolder';
import { useAppStore } from './store/useAppStore';
import './theme/global.css';

if ((import.meta as any).env?.DEV) {
  (window as any).__APP_STORE__ = useAppStore;
}

// Global error handlers logging to local errors.log
window.onerror = (message, source, lineno, colno, error) => {
  console.error('[Global Error]', message, error);
  appFolder.logError('window.onerror', { message, source, lineno, colno, error: error?.stack });
  return false;
};

window.onunhandledrejection = (event) => {
  console.error('[Unhandled Rejection]', event.reason);
  appFolder.logError('unhandledrejection', event.reason);
};

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
