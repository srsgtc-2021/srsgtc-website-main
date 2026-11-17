# SRS Geotech & Construction — Website

A responsive five-page company website built from the supplied 2026 SRS Geotech & Construction company profile.

## Pages
1. Home — reference-inspired geological hero, company introduction, services, capabilities and selected work.
2. About — firm overview, establishment, vision, mission, people, equipment and approach.
3. Services — geotechnical, survey, drilling, grouting, anchor and laboratory capabilities.
4. Projects — selected project references, year filters and field photographs.
5. Contact — office details, email contacts and website.

## Reference hero implementation
The homepage hero is built from separate layers rather than a single flattened banner:
- Main offshore photograph with a diagonal clip path.
- Two independently clipped grayscale / darkened diagonal slash layers and fine edge strokes.
- SVG topographic contour paths.
- Independent upper-left rock ridge overlay.
- Custom SVG Bézier curve with orange stroke, glow and circular scroll marker.
- Separate lower-left and lower-right geological texture overlays.
- Four-column capability row with orange line icons.

The main photograph is currently `public/assets/01-offshore-hero.png`. To change it, replace that file while keeping the same filename, or update the `bg[0].src` reference in `src/App.jsx`.

The three geological overlay assets are in `public/assets/`:
- `reference-rock-ridge.png`
- `reference-rock-lower-left.png`
- `reference-rock-lower-right.png`

They are separate assets so their placement and scale can be refined without baking them into the offshore photograph.

## Run locally
Requires Node.js 18+.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`).

## Production build

```bash
npm run build
npm run preview
```

`npm run build` performs three steps:

1. Builds the browser bundle into `dist/`.
2. Builds the server rendering entry into `dist-ssr/`.
3. Prerenders the five public routes, `admin.html`, `sitemap.xml`, `robots.txt`, `llms.txt`, `llms-full.txt` and `dist/build-meta.json`.

The build reads the live Supabase CMS. It fails rather than publishing incomplete pages if the CMS is unreachable, a required table is missing, or the services/projects tables are empty.

The generated HTML contains the full page markup, page-specific metadata, canonical URL, Open Graph/Twitter tags, JSON-LD and the CMS snapshot used for that build. `src/main.jsx` hydrates the prerendered markup when the snapshot is present and falls back to a normal client render in development or on unknown paths.

## SEO and discovery

- Canonical origin: `https://srsgeotech-zeta.vercel.app` (when a custom domain is connected, update `SITE_URL` in `src/seo/seoConfig.js`, the default head in `index.html`, and the `SITE_URL` environment variable).
- Public routes: `/`, `/about`, `/services`, `/projects`, `/contact`.
- `/company` permanently redirects to `/about`.
- Social image: `public/og-image.jpg` at exactly `1200x630`, cropped from `public/assets/page-13-02-jack-up-barge.png`. The About page keeps using `public/ogimage.png`.
- Admin routes send `X-Robots-Tag: noindex, nofollow`, include a noindex meta tag in `admin.html`, and apply a client-side noindex guard. `robots.txt` intentionally does not disallow `/admin` so crawlers can see the noindex signal.
- `sitemap.xml` lists only indexable canonical URLs with `lastmod` dates and no `changefreq` or `priority`.
- The Admin SEO Manager at `/admin/seo` can store per-page overrides in Supabase. `src/seo/seoConfig.js` remains the default source; blank/null fields fall back to it.

## SEO Manager

Run `supabase/seo-manager.sql` in the Supabase SQL editor before using `/admin/seo`. The migration creates:

- `seo_pages` — one optional row per public path. NULL columns mean "use the code default"; deleting the row restores every default for that path.
- `seo_state` — a singleton timestamp touched by an `INSERT`/`UPDATE`/`DELETE` trigger. It lets `/api/rebuild` detect reset/delete operations that cannot be found through `seo_pages.updated_at`.
- RLS: public read for both tables, admin-only writes for `seo_pages`, and no public writes for `seo_state`.
- A `SECURITY DEFINER` state trigger with a fixed `search_path`, schema-qualified names, and revoked direct execute access.

The editor supports search titles/descriptions, social metadata, noindex, and an OG image from an external URL, site path, or Supabase Storage upload. Uploads happen only when saving; newly uploaded files are removed if the database save fails. Replaced or removed storage images are deleted only after a successful save, and only when they are not referenced by another `seo_pages` row or CMS image slot. Site assets, external URLs, and shared storage images are never removed.

Status badges are intentionally separate:

- Override: `Default`, `Custom`, or `Noindex`.
- Publication: `Pending publication`, `Published`, or `Publication status unavailable` when `/build-meta.json` cannot be read in local development.

Images are checked in the browser for MIME type, file size, dimensions, and aspect ratio. `1200 × 630` (1.91:1) is recommended; warnings appear for images that are too small, far from the target ratio, overly large, oversized in file size, or of an unsupported type.

The generated `dist/build-meta.json` includes a per-path `seo` map (`{ "/about": { "updatedAt": "..." } }`). The Admin SEO Manager compares that deployed map with the current database rows to decide whether a page is pending publication. A reset is treated as pending when the deployed build still contains the old SEO entry.

## Rebuild automation

Vercel runs a daily cron at 03:00 UTC (`/api/rebuild`). The endpoint:

1. Requires `Authorization: Bearer <CRON_SECRET>`.
2. Reads the deployed `/build-meta.json`.
3. Reads the latest `updated_at` from each CMS table, plus `seo_pages` and `seo_state`.
4. Calls `VERCEL_DEPLOY_HOOK_URL` only when the newest timestamp is later than the deployed `contentSnapshotAt`.

A Supabase database webhook (or a scheduled Supabase function) can call the same endpoint on content changes. Configure it as an HTTP POST to `https://<site>/api/rebuild` with the `Authorization: Bearer <CRON_SECRET>` header. The endpoint returns `{ "deployed": false }` when content is not newer, so it is safe to call frequently. Calls made while a new deployment is still building may trigger another deploy because the previous build metadata is still live.

For SEO changes, configure the `seo_pages` webhook for **INSERT, UPDATE and DELETE** and test each event, including **Reset to defaults** (DELETE). The `seo_state` trigger ensures a delete still advances the newest timestamp. Confirm `/api/rebuild` returns `{"deployed":true}` once the deployed build metadata is current. Missing `seo_pages`/`seo_state` tables are ignored by the rebuild endpoint so the site remains deployable before the migration is applied.

The comparison relies on each CMS table maintaining `updated_at` on change. Keep the database trigger (or equivalent) in place; the webhook alone cannot detect a content change if the timestamp is not updated.

Set these environment variables in Vercel:

| Variable | Scope | Purpose |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Build | CMS REST access during prerendering |
| `VITE_SUPABASE_ANON_KEY` | Build | Publishable Supabase key |
| `CRON_SECRET` | Runtime | Bearer secret for `/api/rebuild` |
| `VERCEL_DEPLOY_HOOK_URL` | Runtime | Production deploy hook |
| `SITE_URL` | Runtime (optional) | Canonical host; defaults to the production URL |

`dist/build-meta.json` is deployed with the site and records `builtAt`, `contentSnapshotAt`, `latestContentUpdatedAt`, `commit`, `siteUrl` and the per-path `seo` map. Admin Settings shows the published snapshot and the newest CMS/SEO timestamp, and warns when content is newer than the deployed build.

`vite preview` does not emulate Vercel `cleanUrls`; use the deployed preview or request `/about` on Vercel to verify extensionless routes.

## Content notes
The supplied company profile does not list a phone number, so none has been invented. Project entries and office details are based on the supplied PDF. Please verify current project status and contact details before publishing.
