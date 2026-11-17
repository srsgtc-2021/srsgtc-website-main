export const SITE_URL = 'https://srsgeotech-zeta.vercel.app';
export const SITE_NAME = 'SRS Geotech & Construction';
export const SITE_TAGLINE = 'Ground Insights. Stronger Structures.';

export const DEFAULT_OG_IMAGE = '/og-image.jpg';
export const DEFAULT_OG_IMAGE_WIDTH = 1200;
export const DEFAULT_OG_IMAGE_HEIGHT = 630;
export const DEFAULT_OG_IMAGE_TYPE = 'image/jpeg';
export const DEFAULT_OG_IMAGE_ALT = 'SRS Geotech & Construction jack-up barge on a marine geotechnical operation';

export const ABOUT_OG_IMAGE = '/ogimage.png';
export const ABOUT_OG_IMAGE_WIDTH = 1079;
export const ABOUT_OG_IMAGE_HEIGHT = 1244;
export const ABOUT_OG_IMAGE_TYPE = 'image/png';
export const ABOUT_OG_IMAGE_ALT = 'Mr. Rajesh Singh, proprietor of SRS Geotech & Construction';

export const CONTACT_EMAILS = ['srsgeotech@gmail.com', 'srsgeotech@yahoo.com'];

export const OFFICES = [
  {
    name: 'Gurukrupa Aramus',
    streetAddress: 'A-503, Gurukrupa Aramus, Plot No. 87, Sector 21',
    addressLocality: 'Ulwe, Navi Mumbai',
    addressRegion: 'Maharashtra',
    postalCode: '410206',
    addressCountry: 'IN',
  },
  {
    name: 'Shreeji Darshan',
    streetAddress: 'Shop No. 04, Shreeji Darshan, Plot No. 100, Sector 20',
    addressLocality: 'Ulwe, Navi Mumbai',
    addressRegion: 'Maharashtra',
    postalCode: '410206',
    addressCountry: 'IN',
  },
];

export const PUBLIC_PATHS = ['/', '/about', '/services', '/projects', '/contact'];

export const ROUTES = {
  '/': {
    key: 'home',
    breadcrumbLabel: 'Home',
    title: 'SRS Geotech & Construction | Foundation for Tomorrow',
    description:
      'SRS Geotech & Construction provides geotechnical investigation, topographical and hydrographic survey, piling, grouting, rock anchoring and laboratory testing for land and marine projects.',
    schemaType: 'WebPage',
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    ogImageWidth: DEFAULT_OG_IMAGE_WIDTH,
    ogImageHeight: DEFAULT_OG_IMAGE_HEIGHT,
    ogImageType: DEFAULT_OG_IMAGE_TYPE,
    ogImageAlt: DEFAULT_OG_IMAGE_ALT,
  },
  '/about': {
    key: 'about',
    breadcrumbLabel: 'About',
    title: 'About SRS Geotech & Construction | Geotechnical & Marine Expertise',
    description:
      'Established in 2021, SRS Geotech & Construction delivers on-shore and off-shore soil investigation, survey, drilling, foundation and laboratory services from Ulwe, Navi Mumbai.',
    schemaType: 'AboutPage',
    ogType: 'website',
    ogImage: ABOUT_OG_IMAGE,
    ogImageWidth: ABOUT_OG_IMAGE_WIDTH,
    ogImageHeight: ABOUT_OG_IMAGE_HEIGHT,
    ogImageType: ABOUT_OG_IMAGE_TYPE,
    ogImageAlt: ABOUT_OG_IMAGE_ALT,
  },
  '/services': {
    key: 'services',
    breadcrumbLabel: 'Services',
    title: 'Geotechnical, Survey & Foundation Services | SRS Geotech',
    description:
      'Geotechnical investigation, topographical and hydrographic survey, piling, micro piling, grouting, prestressed rock anchors and laboratory testing for infrastructure and development projects.',
    schemaType: 'CollectionPage',
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    ogImageWidth: DEFAULT_OG_IMAGE_WIDTH,
    ogImageHeight: DEFAULT_OG_IMAGE_HEIGHT,
    ogImageType: DEFAULT_OG_IMAGE_TYPE,
    ogImageAlt: DEFAULT_OG_IMAGE_ALT,
  },
  '/projects': {
    key: 'projects',
    breadcrumbLabel: 'Projects',
    title: 'Selected Projects | SRS Geotech & Construction',
    description:
      'Selected geotechnical investigation, survey, drilling and marine project references from SRS Geotech & Construction across Maharashtra and India.',
    schemaType: 'CollectionPage',
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    ogImageWidth: DEFAULT_OG_IMAGE_WIDTH,
    ogImageHeight: DEFAULT_OG_IMAGE_HEIGHT,
    ogImageType: DEFAULT_OG_IMAGE_TYPE,
    ogImageAlt: DEFAULT_OG_IMAGE_ALT,
  },
  '/contact': {
    key: 'contact',
    breadcrumbLabel: 'Contact',
    title: 'Contact SRS Geotech & Construction | Ulwe, Navi Mumbai',
    description:
      'Contact SRS Geotech & Construction in Ulwe, Navi Mumbai for geotechnical investigation, survey, piling, grouting, rock anchoring and laboratory testing enquiries.',
    schemaType: 'ContactPage',
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    ogImageWidth: DEFAULT_OG_IMAGE_WIDTH,
    ogImageHeight: DEFAULT_OG_IMAGE_HEIGHT,
    ogImageType: DEFAULT_OG_IMAGE_TYPE,
    ogImageAlt: DEFAULT_OG_IMAGE_ALT,
  },
};

const NOT_FOUND = {
  key: 'not-found',
  breadcrumbLabel: 'Page not found',
  title: 'Page not found | SRS Geotech & Construction',
  description: 'The requested page could not be found.',
  schemaType: 'WebPage',
  ogType: 'website',
  ogImage: DEFAULT_OG_IMAGE,
  ogImageWidth: DEFAULT_OG_IMAGE_WIDTH,
  ogImageHeight: DEFAULT_OG_IMAGE_HEIGHT,
  ogImageType: DEFAULT_OG_IMAGE_TYPE,
  ogImageAlt: DEFAULT_OG_IMAGE_ALT,
  noindex: true,
};

export function normalizePath(pathname = '/') {
  if (!pathname) return '/';
  let path = String(pathname).split('?')[0].split('#')[0];
  if (!path.startsWith('/')) path = `/${path}`;
  if (path === '/company') return '/about';
  if (path.length > 1) path = path.replace(/\/+$/, '');
  return path || '/';
}

export function absoluteUrl(path = '') {
  if (!path) return SITE_URL;
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function getRouteMeta(pathname = '/', seoRows = []) {
  const path = normalizePath(pathname);
  const route = ROUTES[path];
  if (!route) {
    return {
      ...NOT_FOUND,
      path,
      canonical: absoluteUrl(path),
    };
  }

  const override = Array.isArray(seoRows)
    ? seoRows.find((row) => normalizePath(row?.path) === path) || null
    : null;
  const hasCustomImage = Boolean(override?.og_image_url);
  const title = override?.title || route.title;
  const description = override?.description || route.description;

  return {
    ...route,
    title,
    description,
    ogTitle: override?.og_title || title,
    ogDescription: override?.og_description || description,
    ogImage: hasCustomImage ? override.og_image_url : route.ogImage,
    ogImageWidth: hasCustomImage ? (override.og_image_width ?? null) : route.ogImageWidth,
    ogImageHeight: hasCustomImage ? (override.og_image_height ?? null) : route.ogImageHeight,
    ogImageType: hasCustomImage ? (override.og_image_type || null) : route.ogImageType,
    ogImageAlt: override?.og_image_alt || route.ogImageAlt,
    noindex: override?.is_indexable === false ? true : Boolean(route.noindex),
    path,
    canonical: path === '/' ? `${SITE_URL}/` : absoluteUrl(path),
  };
}
