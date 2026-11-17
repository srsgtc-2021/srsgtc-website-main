import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSiteContent } from '../lib/siteContent';
import { getRouteMeta } from './seoConfig.js';
import { buildSchemas } from './schemas.js';

export default function StructuredData() {
  const location = useLocation();
  const { serviceItems, projectItems, teamItems, seo } = useSiteContent();

  useEffect(() => {
    const meta = getRouteMeta(location.pathname, seo);
    const schemas = buildSchemas({
      path: location.pathname,
      meta,
      content: { serviceItems, projectItems, teamItems },
    });

    let script = document.getElementById('srs-jsonld');
    if (!script) {
      script = document.createElement('script');
      script.id = 'srs-jsonld';
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(schemas).replace(/</g, '\\u003c');
  }, [location.pathname, serviceItems, projectItems, teamItems, seo]);

  return null;
}
