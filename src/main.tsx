import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'sonner';
import App from './App';
import './index.css';
import { loggers } from './lib/logger';

const logger = loggers.app;

if (import.meta.env.DEV) {
  logger.info('MetaHuman Engine DEV mode');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Toaster position="top-right" richColors closeButton />
  </StrictMode>,
);
