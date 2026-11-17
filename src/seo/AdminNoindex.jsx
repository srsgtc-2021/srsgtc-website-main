import { useEffect } from 'react';

export default function AdminNoindex() {
  useEffect(() => {
    let meta = document.head.querySelector('meta[name="robots"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'robots');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', 'noindex,nofollow');
    if (!document.title || !document.title.startsWith('Admin')) {
      document.title = 'Admin | SRS Geotech & Construction';
    }
  }, []);

  return null;
}
