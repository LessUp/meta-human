import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'sonner';
import App from './App';
import './index.css';

if (import.meta.env.DEV) {
  console.log(
    '%c MetaHuman Engine %c DEV ',
    'background:#3b82f6;color:#fff;padding:2px 6px;border-radius:3px 0 0 3px',
    'background:#334155;color:#fff;padding:2px 6px;border-radius:0 3px 3px 0',
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Toaster position="top-right" richColors closeButton />
  </StrictMode>,
);
