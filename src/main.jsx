import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { pingSupabase } from './lib/keepAlive';
import './styles.css';

const PUBLIC_PATHS = new Set(['/', '/about', '/services', '/projects', '/contact']);
const rootElement = document.getElementById('root');
const snapshot = window.__SITE_CONTENT__;
const pathname = window.location.pathname.length > 1
  ? window.location.pathname.replace(/\/+$/, '')
  : '/';
const canHydrate = PUBLIC_PATHS.has(pathname) && rootElement.hasChildNodes() && Boolean(snapshot);

// Lightweight Supabase activity request.
// Does not block React rendering.
void pingSupabase();

const app = (
  <React.StrictMode>
    <BrowserRouter>
      <App initialContent={snapshot} />
    </BrowserRouter>
  </React.StrictMode>
);

if (canHydrate) {
  try {
    hydrateRoot(rootElement, app);
  } catch (error) {
    console.error('Hydration failed; falling back to client rendering.', error);
    rootElement.replaceChildren();
    createRoot(rootElement).render(app);
  }
} else {
  createRoot(rootElement).render(app);
}
