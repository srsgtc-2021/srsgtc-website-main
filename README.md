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

## Content notes
The supplied company profile does not list a phone number, so none has been invented. Project entries and office details are based on the supplied PDF. Please verify current project status and contact details before publishing.
