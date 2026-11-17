import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import App from './App.jsx';
import { fetchAll } from './lib/siteContent.jsx';

export async function loadContent() {
  return fetchAll();
}

export function render(url, content) {
  const html = renderToString(
    <React.StrictMode>
      <StaticRouter location={url}>
        <App initialContent={content} />
      </StaticRouter>
    </React.StrictMode>
  );
  return { html };
}
