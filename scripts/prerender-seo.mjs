import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  SITE_URL,
  SITE_NAME,
  SITE_TAGLINE,
  PUBLIC_PATHS,
  OFFICES,
  CONTACT_EMAILS,
  getRouteMeta,
  absoluteUrl,
} from '../src/seo/seoConfig.js';
import { buildSchemas } from '../src/seo/schemas.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const TEMPLATE_PATH = path.join(DIST, 'index.html');
const SSR_ENTRY = path.join(ROOT, 'dist-ssr', 'entry-server.js');

const SEO_START = '<!-- SEO_START -->';
const SEO_END = '<!-- SEO_END -->';

const PAGE_FILES = {
  '/': 'index.html',
  '/about': 'about.html',
  '/services': 'services.html',
  '/projects': 'projects.html',
  '/contact': 'contact.html',
};

const CONTENT_KEYS = ['marquee', 'about', 'services', 'projects', 'gallery', 'team', 'home', 'seo'];
const STATIC_FILES = [
  'index.html',
  'src/App.jsx',
  'src/main.jsx',
  'src/styles.css',
  'src/seo',
  'src/lib/siteContent.jsx',
  'scripts/prerender-seo.mjs',
  'public/og-image.jpg',
  'public/ogimage.png',
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function isoNow() {
  return new Date().toISOString();
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeJson(value) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

function dateOnly(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

function maxDate(values) {
  const times = values
    .map((value) => new Date(value))
    .filter((date) => !Number.isNaN(date.getTime()))
    .map((date) => date.getTime());
  return times.length ? new Date(Math.max(...times)).toISOString() : null;
}

function maxUpdated(content, keys) {
  const values = [];
  for (const key of keys) {
    for (const row of content[key] || []) {
      if (row.updated_at) values.push(row.updated_at);
    }
  }
  return maxDate(values);
}

function gitDate(files) {
  try {
    const output = execFileSync(
      'git',
      ['log', '-1', '--format=%cI', '--', ...files],
      { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
    ).trim();
    return output || null;
  } catch {
    return null;
  }
}

function gitCommit() {
  try {
    const output = execFileSync(
      'git',
      ['rev-parse', 'HEAD'],
      { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
    ).trim();
    return output || null;
  } catch {
    return null;
  }
}

function validateContent(content) {
  if (!content || content.error) {
    throw new Error(`CMS fetch failed: ${content?.error || 'unknown error'}`);
  }
  for (const key of CONTENT_KEYS) {
    if (!Array.isArray(content[key])) {
      throw new Error(`CMS table "${key}" did not return an array.`);
    }
  }
  if (!content.services.length) {
    throw new Error('CMS services table is empty; refusing to prerender incomplete pages.');
  }
  if (!content.projects.length) {
    throw new Error('CMS projects table is empty; refusing to prerender incomplete pages.');
  }
}

async function loadContentWithRetry(loadContent) {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const content = await loadContent();
      validateContent(content);
      return content;
    } catch (error) {
      lastError = error;
      console.warn(`[prerender] CMS fetch attempt ${attempt} failed: ${error.message}`);
      if (attempt < 3) await sleep(1500 * attempt);
    }
  }
  throw lastError;
}

function metaTag(attribute, key, value) {
  if (value === undefined || value === null || value === '') return null;
  return `<meta ${attribute}="${key}" content="${escapeHtml(value)}" />`;
}

function headTags(meta, schemas) {
  const image = absoluteUrl(meta.ogImage);
  const robots = meta.noindex ? 'noindex,nofollow' : 'index,follow';
  const ogTitle = meta.ogTitle || meta.title;
  const ogDescription = meta.ogDescription || meta.description;
  return [
    `<title>${escapeHtml(meta.title)}</title>`,
    `<meta name="description" content="${escapeHtml(meta.description)}" />`,
    `<meta name="author" content="${escapeHtml(SITE_NAME)}" />`,
    `<meta name="robots" content="${robots}" />`,
    `<link rel="canonical" href="${escapeHtml(meta.canonical)}" />`,
    metaTag('property', 'og:type', meta.ogType || 'website'),
    metaTag('property', 'og:site_name', SITE_NAME),
    metaTag('property', 'og:title', ogTitle),
    metaTag('property', 'og:description', ogDescription),
    metaTag('property', 'og:url', meta.canonical),
    metaTag('property', 'og:image', image),
    metaTag('property', 'og:image:width', meta.ogImageWidth),
    metaTag('property', 'og:image:height', meta.ogImageHeight),
    metaTag('property', 'og:image:type', meta.ogImageType),
    metaTag('property', 'og:image:alt', meta.ogImageAlt),
    metaTag('property', 'og:locale', 'en_IN'),
    metaTag('name', 'twitter:card', 'summary_large_image'),
    metaTag('name', 'twitter:title', ogTitle),
    metaTag('name', 'twitter:description', ogDescription),
    metaTag('name', 'twitter:image', image),
    metaTag('name', 'twitter:image:alt', meta.ogImageAlt),
    `<script id="srs-jsonld" type="application/ld+json">${safeJson(schemas)}</script>`,
  ].filter(Boolean).join('\n    ');
}

function adminHeadTags() {
  return [
    '<title>Admin | SRS Geotech &amp; Construction</title>',
    '<meta name="robots" content="noindex,nofollow" />',
  ].join('\n    ');
}

function replaceSeoBlock(html, block) {
  const start = html.indexOf(SEO_START);
  const end = html.indexOf(SEO_END);
  if (start === -1 || end === -1 || end < start) {
    throw new Error('SEO markers were not found in dist/index.html.');
  }
  return `${html.slice(0, start)}${SEO_START}\n    ${block}\n    ${SEO_END}${html.slice(end + SEO_END.length)}`;
}

function injectBody(html, appHtml, bootstrap) {
  if (!html.includes('<div id="root"></div>')) {
    throw new Error('The root element was not found in the build template.');
  }
  let output = html.replace('<div id="root"></div>', () => `<div id="root">${appHtml}</div>`);
  output = output.replace(/<body([^>]*)>/, (match, attributes) => `<body${attributes}>${bootstrap}`);
  return output;
}

function pageBootstrap(content, builtAt, contentSnapshotAt, route) {
  return `<script>window.__SITE_CONTENT__=${safeJson(content)};window.__SRS_BUILT_AT__=${safeJson(builtAt)};window.__SRS_CONTENT_SNAPSHOT_AT__=${safeJson(contentSnapshotAt)};window.__SRS_ROUTE__=${safeJson(route)};</script>`;
}

function adminBootstrap(builtAt, contentSnapshotAt) {
  return `<script>window.__SRS_BUILT_AT__=${safeJson(builtAt)};window.__SRS_CONTENT_SNAPSHOT_AT__=${safeJson(contentSnapshotAt)};</script>`;
}

function sitemapXml(lastmods, seoRows) {
  const routes = PUBLIC_PATHS.filter((route) => !getRouteMeta(route, seoRows).noindex);
  const urls = routes.map((route) => {
    const loc = route === '/' ? `${SITE_URL}/` : absoluteUrl(route);
    const lastmod = lastmods[route];
    return `  <url>\n    <loc>${escapeHtml(loc)}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}\n  </url>`;
  }).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

function robotsTxt() {
  return `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`;
}

function plainText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function shorten(value, max = 220) {
  const text = plainText(value);
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

function llmsTxt(content) {
  const pages = PUBLIC_PATHS
    .map((route) => ({ route, meta: getRouteMeta(route, content.seo) }))
    .filter(({ meta }) => !meta.noindex)
    .map(({ meta }) => `- [${plainText(meta.title)}](${meta.canonical}): ${shorten(meta.description)}`)
    .join('\n');

  const services = (content.services || []).map((service, index) => (
    `- [${plainText(service.label || `Service ${index + 1}`)}](${SITE_URL}/services#service-${String(index + 1).padStart(2, '0')}): ${shorten(service.summary || service.body)}`
  )).join('\n');

  const projects = (content.projects || []).map((project) => (
    `- ${plainText(project.label || 'Project')}${project.year ? ` (${plainText(project.year)})` : ''}${project.client ? ` — ${plainText(project.client)}` : ''}`
  )).join('\n');

  const offices = OFFICES.map((office) => (
    `- ${office.name}: ${office.streetAddress}, ${office.addressLocality}, ${office.addressRegion} ${office.postalCode}`
  )).join('\n');

  return `# ${SITE_NAME}\n\n> ${SITE_TAGLINE}\n\nSRS Geotech & Construction provides on-shore and off-shore geotechnical investigation, survey, drilling, foundation, grouting, rock anchoring and laboratory testing from Ulwe, Navi Mumbai.\n\n## Pages\n${pages}\n\n## Services\n${services}\n\n## Selected projects\n${projects}\n\n## Contact\n${CONTACT_EMAILS.map((email) => `- Email: ${email}`).join('\n')}\n${offices}\n\n## Canonical site\n${SITE_URL}\n`;
}

function llmsFullTxt(content) {
  const home = getRouteMeta('/', content.seo);
  const about = getRouteMeta('/about', content.seo);

  const services = (content.services || []).map((service, index) => (
    `### ${plainText(service.label || `Service ${index + 1}`)}\n\n${plainText(service.summary)}\n\n${String(service.body || '').trim()}\n`
  )).join('\n');

  const projects = (content.projects || []).map((project) => (
    `### ${plainText(project.label || 'Project')}\n\n${[plainText(project.year), project.client ? `Client: ${plainText(project.client)}` : ''].filter(Boolean).join(' · ')}\n\n${String(project.body || '').trim()}\n`
  )).join('\n');

  const team = (content.team || []).map((person) => (
    `- ${plainText(person.name)} — ${[plainText(person.role), plainText(person.qualification), plainText(person.experience) ? `${plainText(person.experience)} experience` : ''].filter(Boolean).join(', ')}`
  )).join('\n');

  const offices = OFFICES.map((office) => (
    `- ${office.name}: ${office.streetAddress}, ${office.addressLocality}, ${office.addressRegion} ${office.postalCode}, India`
  )).join('\n');

  return `# ${SITE_NAME} — Full Content\n\n> ${SITE_TAGLINE}\n\nCanonical site: ${SITE_URL}\n\n## Home\n${plainText(home.description)}\n\n## About\n${plainText(about.description)}\n\n## Services\n${services}\n\n## Projects\n${projects}\n\n## People\n${team}\n\n## Contact\n${CONTACT_EMAILS.map((email) => `- Email: ${email}`).join('\n')}\n${offices}\n\n## Website\n${SITE_URL}\n`;
}

function seoUpdated(content, route) {
  return (content.seo || []).find((row) => row?.path === route)?.updated_at || null;
}

function routeLastmods(content, commonDate) {
  return {
    '/': dateOnly(maxDate([
      commonDate,
      maxUpdated(content, ['marquee', 'home', 'services', 'projects']),
      seoUpdated(content, '/'),
    ]) || commonDate),
    '/about': dateOnly(maxDate([
      commonDate,
      maxUpdated(content, ['about', 'team']),
      seoUpdated(content, '/about'),
    ]) || commonDate),
    '/services': dateOnly(maxDate([
      commonDate,
      maxUpdated(content, ['services']),
      seoUpdated(content, '/services'),
    ]) || commonDate),
    '/projects': dateOnly(maxDate([
      commonDate,
      maxUpdated(content, ['projects', 'gallery']),
      seoUpdated(content, '/projects'),
    ]) || commonDate),
    '/contact': dateOnly(maxDate([
      commonDate,
      seoUpdated(content, '/contact'),
    ]) || commonDate),
  };
}

async function main() {
  const contentSnapshotAt = isoNow();
  const ssr = await import(`${pathToFileURL(SSR_ENTRY).href}?t=${Date.now()}`);
  const content = await loadContentWithRetry(ssr.loadContent);
  const template = await readFile(TEMPLATE_PATH, 'utf8');
  const builtAt = isoNow();
  const commonDate = gitDate(STATIC_FILES) || process.env.VERCEL_GIT_COMMIT_AUTHOR_DATE || contentSnapshotAt;
  const lastmods = routeLastmods(content, commonDate);

  for (const route of PUBLIC_PATHS) {
    const meta = getRouteMeta(route, content.seo);
    const schemas = buildSchemas({ path: route, meta, content });
    const { html: appHtml } = ssr.render(route, content);
    let html = replaceSeoBlock(template, headTags(meta, schemas));
    html = injectBody(html, appHtml, pageBootstrap(content, builtAt, contentSnapshotAt, route));
    await writeFile(path.join(DIST, PAGE_FILES[route]), html, 'utf8');
  }

  let adminHtml = replaceSeoBlock(template, adminHeadTags());
  adminHtml = injectBody(adminHtml, '', adminBootstrap(builtAt, contentSnapshotAt));
  await writeFile(path.join(DIST, 'admin.html'), adminHtml, 'utf8');

  await writeFile(path.join(DIST, 'sitemap.xml'), sitemapXml(lastmods, content.seo), 'utf8');
  await writeFile(path.join(DIST, 'robots.txt'), robotsTxt(), 'utf8');
  await writeFile(path.join(DIST, 'llms.txt'), llmsTxt(content), 'utf8');
  await writeFile(path.join(DIST, 'llms-full.txt'), llmsFullTxt(content), 'utf8');

  const seoSnapshot = Object.fromEntries(
    (content.seo || [])
      .filter((row) => row?.path && row?.updated_at)
      .map((row) => [row.path, { updatedAt: row.updated_at }])
  );

  const buildMeta = {
    builtAt,
    contentSnapshotAt,
    latestContentUpdatedAt: maxUpdated(content, CONTENT_KEYS),
    commit: process.env.VERCEL_GIT_COMMIT_SHA || gitCommit(),
    siteUrl: SITE_URL,
    seo: seoSnapshot,
  };
  await writeFile(path.join(DIST, 'build-meta.json'), `${JSON.stringify(buildMeta, null, 2)}\n`, 'utf8');

  console.log(`[prerender] Generated ${PUBLIC_PATHS.length} public pages, admin.html, sitemap.xml, robots.txt, llms.txt, llms-full.txt and build-meta.json.`);
}

main().catch((error) => {
  console.error('[prerender] Failed:', error);
  process.exit(1);
});
