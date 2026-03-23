#!/usr/bin/env node
/**
 * Generates PWA icons for Tasbih Digital.
 * Produces icon-192-{theme}.png and icon-512-{theme}.png for each of the
 * three app themes (dark, blue, light), then copies the blue variant as
 * the default icon-192.png / icon-512.png.
 *
 * Requires: sharp  (already in devDependencies)
 * Run:      node scripts/generate-icons.js
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Theme colour palettes ────────────────────────────────────────────────────
const THEMES = {
  dark: {
    bg:        "#1A1A1A",   // --card  (dark)
    string:    "#9A6E18",   // darker primary
    beads:     "#F5A623",   // --primary (dark)
    highlight: "#FFCA60",   // lighter bead shine
  },
  blue: {
    bg:        "#151E29",   // --card  (blue/navy)
    string:    "#7A5A14",
    beads:     "#E4B15A",   // --primary (blue)
    highlight: "#F2C878",
  },
  light: {
    bg:        "#F3F5F8",   // --background (light)
    string:    "#7A5518",
    beads:     "#B8822E",   // --primary (light)
    highlight: "#D4A870",
  },
};

// ─── SVG tasbih icon ─────────────────────────────────────────────────────────
function f(n) { return n.toFixed(2); }

function createTasbihSVG(size, { bg, string: sc, beads, highlight }) {
  const cx  = size / 2;
  const cy  = size * 0.452;          // slightly above centre for tassel room
  const cornerR = size * 0.18;       // rounded rect corner radius
  const ringR   = size * 0.29;       // radius of the bead ring
  const beadR   = size * 0.034;      // individual bead radius
  const stringW = size * 0.013;      // connecting-string stroke width
  const N = 22;                      // number of beads

  // ── Bead circles ────────────────────────────────────────────────────────────
  const beadEls = [];
  for (let i = 0; i < N; i++) {
    const angle = -Math.PI / 2 + (2 * Math.PI * i / N);
    const bx = cx + ringR * Math.cos(angle);
    const by = cy + ringR * Math.sin(angle);
    // small highlight inside each bead (top-left)
    const hx = bx - beadR * 0.28;
    const hy = by - beadR * 0.32;
    const hr = beadR * 0.42;
    beadEls.push(
      `<circle cx="${f(bx)}" cy="${f(by)}" r="${f(beadR)}" fill="${beads}"/>` +
      `<circle cx="${f(hx)}" cy="${f(hy)}" r="${f(hr)}" fill="${highlight}" opacity="0.45"/>`
    );
  }

  // ── Tassel geometry ─────────────────────────────────────────────────────────
  const tassleY  = cy + ringR;               // bottom of bead ring
  const stemLen  = size * 0.054;             // cord length below ring
  const knotY    = tassleY + stemLen;
  const knotRx   = size * 0.027;
  const knotRy   = size * 0.020;
  const fringeY0 = knotY + knotRy + size * 0.009;
  const fringeLen = size * 0.082;

  const fringeEls = [];
  for (let i = 0; i < 6; i++) {
    const t = i / 5;
    const spread = (t - 0.5) * 2;           // −1 … +1
    const sx = cx + spread * size * 0.014;
    const ex = cx + spread * size * 0.047;
    fringeEls.push(
      `<line x1="${f(sx)}" y1="${f(fringeY0)}" x2="${f(ex)}" y2="${f(fringeY0 + fringeLen)}" ` +
      `stroke="${sc}" stroke-width="${f(size * 0.010)}" stroke-linecap="round"/>`
    );
  }

  return `\
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <!-- Background -->
  <rect width="${size}" height="${size}" rx="${f(cornerR)}" fill="${bg}"/>

  <!-- Connecting string (ring behind beads) -->
  <circle cx="${f(cx)}" cy="${f(cy)}" r="${f(ringR)}" fill="none" stroke="${sc}" stroke-width="${f(stringW)}"/>

  <!-- Beads -->
  ${beadEls.join("\n  ")}

  <!-- Tassel cord -->
  <line x1="${f(cx)}" y1="${f(tassleY)}" x2="${f(cx)}" y2="${f(knotY)}"
        stroke="${sc}" stroke-width="${f(size * 0.013)}" stroke-linecap="round"/>

  <!-- Tassel knot bead -->
  <ellipse cx="${f(cx)}" cy="${f(knotY)}" rx="${f(knotRx)}" ry="${f(knotRy)}" fill="${beads}"/>

  <!-- Tassel fringe -->
  ${fringeEls.join("\n  ")}
</svg>`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function generateIcons() {
  const publicDir = path.join(__dirname, "../public");
  const sizes = [192, 512];

  for (const [themeName, colors] of Object.entries(THEMES)) {
    for (const size of sizes) {
      const svg = createTasbihSVG(size, colors);
      const buf = await sharp(Buffer.from(svg)).png().toBuffer();
      const out = path.join(publicDir, `icon-${size}-${themeName}.png`);
      fs.writeFileSync(out, buf);
      console.log(`✅  icon-${size}-${themeName}.png`);
    }
  }

  // Default icons = blue theme (closest to the reference image)
  for (const size of sizes) {
    const src = path.join(publicDir, `icon-${size}-blue.png`);
    const dst = path.join(publicDir, `icon-${size}.png`);
    fs.copyFileSync(src, dst);
    console.log(`📋  icon-${size}.png  ← blue`);
  }

  console.log("\n🎉  All icons generated.");
}

generateIcons().catch((err) => {
  console.error(err);
  process.exit(1);
});
