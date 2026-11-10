import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { pingSupabase } from './lib/keepAlive';
import './styles.css';

// Lightweight Supabase activity request.
// Does not block React rendering.
void pingSupabase();

createRoot(document.getElementById('root')).render(
  <React.StrictMode><BrowserRouter><App /></BrowserRouter></React.StrictMode>
);