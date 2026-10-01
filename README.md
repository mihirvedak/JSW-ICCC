# JSW-ICCC

JSW ICCC — industrial monitoring dashboard (Factory 360).

The app lives in `OriginalIndustrial monitoring dashboard prototype (1)/`. `npm run build` turns it
into a fully self-hosted static site in `dist/` — no CDN calls at runtime except the Excel library,
which is fetched from jsDelivr only when a user uploads a targets workbook.

| URL | Page |
|---|---|
| `/` (`index.html`) | Main dashboard, light theme (`JSW ICCC.dc.html`) |
| `/BF1-SCADA.dc.html` | BF1 SCADA overview (also opens from Process → BF1 → SCADA View) |
| `/JSW%20ICCC%20standalone.dc.html` | Older dark-theme dashboard |
| `/JSW%20ICCC%20Dashboard.html` | Older dark-theme dashboard, single-file bundle |
| `/LineChart.dc.html`, `/BarCompare.dc.html`, `/ComboChart.dc.html` | Chart components (blank on their own) |

The design-system CSS, icon font, dataset (`iccc-data.js`), `image-slot.js` and images under
`assets/` were missing from the original export and were recovered from the single-file bundle.
The build serves React 18.3.1 from npm (same files and SRI hashes as the unpkg URLs `support.js` uses).

## Run locally

```bash
npm install
npm run dev            # builds dist/ and serves it on http://localhost:4173 (override with PORT)
```

## Build

```bash
npm run build          # writes dist/
```

`dist/` is a plain static site — upload it to any static host (Nginx, S3/CloudFront, Netlify,
Vercel, GitHub Pages, Azure Static Web Apps). Build command: `npm run build`, output directory: `dist`.

## Docker

```bash
docker build -t jsw-iccc .
docker run -p 8080:80 jsw-iccc   # http://localhost:8080, health check at /healthz
```

Serves the page through nginx with gzip and basic security headers.

Note: pages probe an optional `.image-slots.state.json`; its 404 is harmless. Don't add an SPA
fallback that rewrites unknown paths to `index.html` — the pages load each other by file name.
