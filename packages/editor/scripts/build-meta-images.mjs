/**
 * Rendert Favicons, App-Icons und das Vorschaubild (Open Graph, 1200 x 630)
 * nach packages/editor/public. Quelle der Icons ist public/favicon.svg, das
 * Vorschaubild zeigt die echten Faltmuster aus examples/*.json.
 *
 * Aufruf: pnpm --filter @faltstudio/editor meta-images
 */
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = new URL('../', import.meta.url);
const PUBLIC = new URL('public/', ROOT);
const EXAMPLES = new URL('../../examples/', ROOT);
const FONTS = new URL('node_modules/@fontsource/', ROOT);

const DASH = { valley: '6 4', mountain: '10 3 2 3', flat: '1 3' };
const ICON = readFileSync(new URL('favicon.svg', PUBLIC), 'utf8');

/** Vollflaechig fuer iOS und maskierbare Icons: das System rundet selbst ab. */
const fullBleed = (svg, scale) =>
  svg
    .replace('rx="14"', 'rx="0"')
    .replace(/<path/g, `<path transform="translate(32 32) scale(${scale}) translate(-32 -32)"`);

const ICONS = [
  { file: 'favicon-32.png', size: 32, svg: ICON },
  { file: 'apple-touch-icon.png', size: 180, svg: fullBleed(ICON, 0.86) },
  { file: 'icon-192.png', size: 192, svg: ICON },
  { file: 'icon-512.png', size: 512, svg: ICON },
  { file: 'icon-maskable-512.png', size: 512, svg: fullBleed(ICON, 0.72) },
];

function creaseSvg(tutorial) {
  const { width, height } = tutorial.sheet;
  const at = new Map(tutorial.vertices.map((vertex) => [vertex.id, vertex]));
  const lines = tutorial.creases
    .filter((crease) => crease.kind !== 'border')
    .map((crease) => {
      const a = at.get(crease.a);
      const b = at.get(crease.b);
      return `<line x1="${a.x}" y1="${height - a.y}" x2="${b.x}" y2="${height - b.y}" stroke-dasharray="${DASH[crease.kind] ?? ''}"/>`;
    })
    .join('');
  return `<svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none"><g fill="none" stroke="#2e2e2e" stroke-width="1.2" vector-effect="non-scaling-stroke">${lines}</g></svg>`;
}

function readExamples() {
  return readdirSync(EXAMPLES)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => JSON.parse(readFileSync(new URL(name, EXAMPLES), 'utf8')));
}

/** Als data-URL eingebettet: von about:blank aus darf Chromium keine lokalen Dateien laden. */
const dataUrl = (url, type) => `data:${type};base64,${readFileSync(url).toString('base64')}`;

function ogHtml() {
  const font = (path) => dataUrl(new URL(path, FONTS), 'font/woff2');
  const sheets = readExamples()
    .slice(0, 3)
    .map(
      (tutorial, index) =>
        `<div class="sheet s${index}">${creaseSvg(tutorial)}<b>${String(index + 1).padStart(2, '0')}</b></div>`,
    )
    .join('');
  return `<!doctype html><html><head><style>
    @font-face { font-family: 'Space Grotesk'; font-weight: 300; src: url(${font('space-grotesk/files/space-grotesk-latin-300-normal.woff2')}); }
    @font-face { font-family: 'Space Grotesk'; font-weight: 500; src: url(${font('space-grotesk/files/space-grotesk-latin-500-normal.woff2')}); }
    @font-face { font-family: 'JetBrains Mono'; font-weight: 400; src: url(${font('jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2')}); }
    @font-face { font-family: 'JetBrains Mono'; font-weight: 700; src: url(${font('jetbrains-mono/files/jetbrains-mono-latin-700-normal.woff2')}); }
    * { box-sizing: border-box; margin: 0; }
    body { width: 1200px; height: 630px; overflow: hidden; position: relative; color: #d9d9d9;
      background: radial-gradient(ellipse 60% 70% at 72% 100%, #1c1c1c, transparent), #0b0b0b;
      font-family: 'JetBrains Mono', monospace; }
    .text { position: absolute; left: 72px; top: 72px; width: 520px; display: grid; gap: 22px; }
    .brand { display: flex; align-items: center; gap: 16px; font-size: 18px; font-weight: 700; letter-spacing: 0.24em; }
    .brand img { width: 44px; height: 44px; }
    .index { font: 300 150px/0.78 'Space Grotesk'; letter-spacing: -0.06em; color: transparent;
      -webkit-text-stroke: 1.5px #bdbdbd; margin-top: 18px; }
    h1 { font: 500 58px/1.02 'Space Grotesk'; letter-spacing: -0.02em; color: #f5f5f5; }
    p { font-size: 20px; line-height: 1.5; color: #bdbdbd; }
    .tags { font-size: 14px; letter-spacing: 0.2em; color: #9a9a9a; text-transform: uppercase; }
    .sheet { position: absolute; top: 200px; width: 230px; height: 325px; background: #cfcfcf;
      box-shadow: 0 30px 40px rgba(0, 0, 0, 0.65); transform-origin: 50% 120%; }
    .sheet svg { position: absolute; inset: 0; width: 100%; height: 100%; }
    .sheet b { position: absolute; left: 9px; bottom: 7px; font-size: 13px; color: #0b0b0b; }
    .s0 { left: 700px; transform: translateY(40px) rotate(-9deg); }
    .s1 { left: 835px; transform: translateY(-34px) scale(1.06); z-index: 2;
      outline: 1.5px solid #f5f5f5; outline-offset: 7px; }
    .s2 { left: 970px; transform: translateY(40px) rotate(9deg); }
  </style></head><body>
    ${sheets}
    <div class="text">
      <div class="brand"><img src="${dataUrl(new URL('favicon.svg', PUBLIC), 'image/svg+xml')}" alt="">FALTSTUDIO</div>
      <div class="index">01</div>
      <h1>Fold paper planes in 3D.</h1>
      <p>Draw the creases, plan the steps, then fold along by dragging the corner.</p>
      <div class="tags">Editor · Viewer · Open source</div>
    </div>
  </body></html>`;
}

const browser = await chromium.launch();
try {
  for (const icon of ICONS) {
    const page = await browser.newPage({ viewport: { width: icon.size, height: icon.size } });
    await page.setContent(
      `<style>html,body{margin:0;background:transparent}svg{display:block;width:${icon.size}px;height:${icon.size}px}</style>${icon.svg}`,
    );
    await page.screenshot({
      path: fileURLToPath(new URL(icon.file, PUBLIC)),
      omitBackground: true,
    });
    await page.close();
  }
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.goto('about:blank');
  await page.setContent(ogHtml(), { waitUntil: 'load' });
  await page.evaluate(() => globalThis.document.fonts.ready);
  await page.screenshot({ path: fileURLToPath(new URL('og-image.png', PUBLIC)) });
  console.log(`${ICONS.length} icons + og-image.png -> packages/editor/public`);
} finally {
  await browser.close();
}
