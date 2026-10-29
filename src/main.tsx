import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

// Global Diagnostic & Unhandled Rejection Safeguard
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    console.warn('[VitaBoost Diagnostic] Intercepted unhandled promise rejection:', event.reason);
    // Prevent unhandled rejection from bubbling to uncaught error status
    event.preventDefault();
  });

  window.addEventListener('error', (event) => {
    // Gracefully handle cross-script or resource loading issues
    if (event.filename && !event.filename.includes('localhost') && !event.filename.includes(window.location.hostname)) {
      return;
    }
    console.warn('[VitaBoost Diagnostic] Caught browser runtime event:', event.message);
  });
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
