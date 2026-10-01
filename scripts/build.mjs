// Builds dist/ as a fully self-hosted static site: every page in the app folder, the
// restored design-system/icon/data assets, and React served locally instead of from unpkg.
import { copyFile, cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const app = join(root, 'OriginalIndustrial monitoring dashboard prototype (1)');
const out = join(root, 'dist');

const TITLES = {
  'JSW ICCC.dc.html': 'JSW ICCC — Factory 360',
  'JSW ICCC standalone.dc.html': 'JSW ICCC — Factory 360 (dark)',
  'BF1-SCADA.dc.html': 'BF1 — Blast Furnace SCADA',
  'LineChart.dc.html': 'Line Chart',
  'BarCompare.dc.html': 'Bar Compare',
  'ComboChart.dc.html': 'Combo Chart',
};

function replaceOrThrow(text, from, to, file) {
  if (!text.includes(from)) throw new Error(`${file}: expected to find ${from}`);
  return text.split(from).join(to);
}

async function edit(file, fn) {
  const path = join(out, file);
  await writeFile(path, fn(await readFile(path, 'utf8')));
}

await rm(out, { recursive: true, force: true });
await cp(app, out, { recursive: true, filter: src => !src.startsWith(join(app, 'screenshots')) });

// React: same files (and SRI hashes) as the unpkg URLs support.js loads, served from vendor/.
await mkdir(join(out, 'vendor'), { recursive: true });
await copyFile(join(root, 'node_modules/react/umd/react.production.min.js'), join(out, 'vendor/react.production.min.js'));
await copyFile(join(root, 'node_modules/react-dom/umd/react-dom.production.min.js'), join(out, 'vendor/react-dom.production.min.js'));
await edit('support.js', s => {
  s = replaceOrThrow(s, 'https://unpkg.com/react@18.3.1/umd/react.production.min.js', './vendor/react.production.min.js', 'support.js');
  return replaceOrThrow(s, 'https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js', './vendor/react-dom.production.min.js', 'support.js');
});

// The dark standalone page pulls Phosphor icons from unpkg; point it at the local copy.
await edit('JSW ICCC standalone.dc.html', s => {
  s = replaceOrThrow(s, '<link rel="stylesheet" href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/regular/style.css">', '<link rel="stylesheet" href="assets/icons/phosphor-lite.css">', 'standalone');
  return replaceOrThrow(s, '<link rel="stylesheet" href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/fill/style.css">', '', 'standalone');
});

for (const [file, title] of Object.entries(TITLES)) {
  // Only the document's own <head>: later "<head>" strings live inside page scripts.
  await edit(file, s => {
    const i = s.indexOf('<head>');
    if (i === -1) throw new Error(`${file}: expected to find <head>`);
    return s.slice(0, i + 6) + `\n<title>${title}</title>` + s.slice(i + 6);
  });
}

// The older dark export is a self-unpacking bundle whose page template has no title.
await edit('JSW ICCC Dashboard.html', s => {
  const viewport = String.raw`<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">`;
  s = replaceOrThrow(s, '<title>Bundled Page</title>', '<title>JSW ICCC — Factory 360 (dark bundle)</title>', 'bundle');
  return replaceOrThrow(s, viewport, `${viewport}\\n<title>JSW ICCC — Factory 360 (dark bundle)<\\u002Ftitle>`, 'bundle');
});

// The light-theme dashboard is the main app.
await copyFile(join(out, 'JSW ICCC.dc.html'), join(out, 'index.html'));

const pages = (await readdir(out)).filter(f => f.endsWith('.html'));
console.log(`Built dist/ with ${pages.length} pages:\n  ${pages.join('\n  ')}`);
