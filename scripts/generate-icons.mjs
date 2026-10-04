/**
 * Generates the Winter Arc logo (a barbell bending into an arc over a
 * snowflake) as SVG, plus PNG / ICO renders for favicons and PWA installs.
 *
 * Usage: npm run icons
 */
import { chromium } from "playwright";
import fs from "node:fs/promises";

const P0 = [100, 334];
const C = [256, 110];
const P2 = [412, 334];

function point(t) {
  const u = 1 - t;
  return [
    u * u * P0[0] + 2 * u * t * C[0] + t * t * P2[0],
    u * u * P0[1] + 2 * u * t * C[1] + t * t * P2[1],
  ];
}

function angleDeg(t) {
  const dx = 2 * (1 - t) * (C[0] - P0[0]) + 2 * t * (P2[0] - C[0]);
  const dy = 2 * (1 - t) * (C[1] - P0[1]) + 2 * t * (P2[1] - C[1]);
  return (Math.atan2(dy, dx) * 180) / Math.PI;
}

function segment(a, b) {
  const start = point(a);
  const end = point(b);
  const ctrl = [0, 1].map(
    (i) =>
      (1 - a) * (1 - b) * P0[i] +
      ((1 - a) * b + a * (1 - b)) * C[i] +
      a * b * P2[i],
  );
  const f = (n) => n.toFixed(1);
  return `M${f(start[0])} ${f(start[1])} Q${f(ctrl[0])} ${f(ctrl[1])} ${f(end[0])} ${f(end[1])}`;
}

function plate(t, w, h, rx) {
  const [x, y] = point(t);
  return `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${rx}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${angleDeg(t).toFixed(1)})"/>`;
}

function snowflake(cx, cy, r, stroke, branches) {
  const b1 = r * 0.6;
  const b2 = r * 0.27;
  const arm = branches
    ? `M0 0V${-r}M0 ${-b1}l${-r * 0.25} ${-r * 0.23}M0 ${-b1}l${r * 0.25} ${-r * 0.23}M0 ${-b2}l${-r * 0.16} ${-r * 0.16}M0 ${-b2}l${r * 0.16} ${-r * 0.16}`
    : `M0 0V${-r}M0 ${-b1}l${-r * 0.3} ${-r * 0.28}M0 ${-b1}l${r * 0.3} ${-r * 0.28}`;
  const arms = [0, 60, 120, 180, 240, 300]
    .map((deg) => `<path transform="rotate(${deg})" d="${arm}"/>`)
    .join("");
  return `<g transform="translate(${cx} ${cy})" fill="none" stroke="#eef7fc" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">${arms}</g>`;
}

function mark({ small }) {
  const barW = small ? 40 : 30;
  const sleeveW = small ? 22 : 14;
  const tInner = 0.105;
  const tOuter = 0.038;
  const big = small ? [40, 132, 12] : [32, 120, 10];
  const little = small ? [28, 92, 10] : [22, 84, 8];

  return `
    <path d="${segment(0, 1)}" fill="none" stroke="#7fb4cc" stroke-width="${sleeveW}" stroke-linecap="round"/>
    <path d="${segment(tInner, 1 - tInner)}" fill="none" stroke="url(#wa-bar)" stroke-width="${barW}" stroke-linecap="round"/>
    <g fill="#a9d2e5">
      ${plate(tInner, ...big)}
      ${plate(1 - tInner, ...big)}
      ${plate(tOuter, ...little)}
      ${plate(1 - tOuter, ...little)}
    </g>
    ${small ? snowflake(256, 322, 70, 24, false) : snowflake(256, 320, 64, 12, true)}`;
}

function svg({ shape = "tile", small = false, scale = 1 } = {}) {
  const tile = shape === "tile";
  const bg = tile
    ? `<rect width="512" height="512" rx="112" fill="url(#wa-bg)"/>
  <rect width="512" height="512" rx="112" fill="url(#wa-glow)"/>
  <rect x="5" y="5" width="502" height="502" rx="107" fill="none" stroke="#9ec9de" stroke-opacity="0.24" stroke-width="4"/>`
    : `<rect width="512" height="512" fill="url(#wa-bg)"/>
  <rect width="512" height="512" fill="url(#wa-glow)"/>`;

  // Content's visual centre sits ~38px below the canvas centre.
  const k = scale;
  const tx = 256 - 256 * k;
  const ty = 256 - 294 * k;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="Winter Arc">
  <defs>
    <linearGradient id="wa-bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#16304d"/>
      <stop offset="1" stop-color="#07111f"/>
    </linearGradient>
    <radialGradient id="wa-glow" cx="0.5" cy="0.4" r="0.55">
      <stop offset="0" stop-color="#9ec9de" stop-opacity="0.26"/>
      <stop offset="1" stop-color="#9ec9de" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="wa-bar" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#5ea6c4"/>
      <stop offset="0.5" stop-color="#e3f1f8"/>
      <stop offset="1" stop-color="#5ea6c4"/>
    </linearGradient>
  </defs>
  ${bg}
  <g transform="translate(${tx.toFixed(1)} ${ty.toFixed(1)}) scale(${k})">${mark({ small })}
  </g>
</svg>
`;
}

function ico(pngs) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  let offset = 6 + 16 * pngs.length;
  const entries = pngs.map(({ size, data }) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt8(0, 2);
    e.writeUInt8(0, 3);
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += data.length;
    return e;
  });
  return Buffer.concat([header, ...entries, ...pngs.map((p) => p.data)]);
}

async function render(page, markup, size) {
  await page.setViewportSize({ width: size, height: size });
  const b64 = Buffer.from(markup).toString("base64");
  await page.setContent(
    `<html><body style="margin:0;background:transparent"><img src="data:image/svg+xml;base64,${b64}" width="${size}" height="${size}" style="display:block"></body></html>`,
  );
  await page.waitForFunction(() => document.images[0]?.complete);
  return page.screenshot({ omitBackground: true, type: "png" });
}

async function main() {
  const full = svg({ scale: 1.12 });
  const fullBleed = svg({ shape: "square", scale: 1.12 });
  const maskable = svg({ shape: "square", scale: 0.9 });
  const tiny = svg({ small: true, scale: 1.2 });

  await fs.mkdir("public/icons", { recursive: true });
  await fs.writeFile("public/icons/icon.svg", full);
  await fs.writeFile("src/app/icon.svg", full);

  const browser = await chromium.launch();
  const page = await browser.newPage();

  const out = [
    ["public/icons/icon-192.png", full, 192],
    ["public/icons/icon-512.png", full, 512],
    ["public/icons/icon-maskable-512.png", maskable, 512],
    ["src/app/apple-icon.png", fullBleed, 180],
  ];
  for (const [file, markup, size] of out) {
    await fs.writeFile(file, await render(page, markup, size));
    console.log("wrote", file);
  }

  const favicon = [];
  for (const size of [16, 32, 48]) {
    favicon.push({ size, data: await render(page, tiny, size) });
  }
  await fs.writeFile("src/app/favicon.ico", ico(favicon));
  console.log("wrote src/app/favicon.ico");

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
