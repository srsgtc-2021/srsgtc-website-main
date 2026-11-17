import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSiteContent } from '../lib/siteContent';
import { SITE_NAME, absoluteUrl, getRouteMeta } from './seoConfig.js';

function upsertMeta(attribute, key, content) {
  if (content === undefined || content === null) return;
  let element = document.head.querySelector(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute('content', String(content));
}

function removeMeta(attribute, key) {
  document.head.querySelector(`meta[${attribute}="${key}"]`)?.remove();
}

function syncMeta(attribute, key, content) {
  if (content === undefined || content === null) removeMeta(attribute, key);
  else upsertMeta(attribute, key, content);
}

function upsertLink(rel, href) {
  let element = document.head.querySelector(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    document.head.appendChild(element);
  }
  element.setAttribute('href', href);
}

export default function SeoHead() {
  const location = useLocation();
  const { seo } = useSiteContent();

  useEffect(() => {
    const meta = getRouteMeta(location.pathname, seo);
    const image = absoluteUrl(meta.ogImage);
    const ogTitle = meta.ogTitle || meta.title;
    const ogDescription = meta.ogDescription || meta.description;

    document.title = meta.title;
    document.documentElement.lang = 'en-IN';

    upsertMeta('name', 'description', meta.description);
    upsertMeta('name', 'author', SITE_NAME);
    upsertMeta('name', 'robots', meta.noindex ? 'noindex,nofollow' : 'index,follow');
    upsertLink('canonical', meta.canonical);

    upsertMeta('property', 'og:type', meta.ogType || 'website');
    upsertMeta('property', 'og:site_name', SITE_NAME);
    upsertMeta('property', 'og:title', ogTitle);
    upsertMeta('property', 'og:description', ogDescription);
    upsertMeta('property', 'og:url', meta.canonical);
    upsertMeta('property', 'og:image', image);
    syncMeta('property', 'og:image:width', meta.ogImageWidth);
    syncMeta('property', 'og:image:height', meta.ogImageHeight);
    syncMeta('property', 'og:image:type', meta.ogImageType);
    syncMeta('property', 'og:image:alt', meta.ogImageAlt);
    upsertMeta('property', 'og:locale', 'en_IN');

    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', ogTitle);
    upsertMeta('name', 'twitter:description', ogDescription);
    upsertMeta('name', 'twitter:image', image);
    syncMeta('name', 'twitter:image:alt', meta.ogImageAlt);
  }, [location.pathname, seo]);

  return null;
}
