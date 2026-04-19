/**
 * Generates all app icons (default + alternates) for iOS, Android and PWA.
 * Run: node scripts/generate-app-icon.mjs
 *
 * Default icon = light palette (matches default app theme).
 * Alternate icons: dark, blue.
 * Emerald palette saved for later as a premium variant.
 */

import { chromium } from "playwright";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const PALETTES = {
  // Default — matches light theme
  default: {
    bg: "linear-gradient(180deg,#E8ECF2 0%,#F3F5F8 50%,#E8ECF2 100%)",
    glow: "rgba(184,130,46,0.12)",
    text: "linear-gradient(180deg,#C4971A 0%,#B8822E 55%,#7A5610 100%)",
    ornament: "#B8822E",
    ornamentOpacity: 0.55,
  },
  dark: {
    bg: "linear-gradient(180deg,#050505 0%,#0A0A0A 50%,#050505 100%)",
    glow: "rgba(245,166,35,0.10)",
    text: "linear-gradient(180deg,#FFD97A 0%,#F5A623 55%,#B87515 100%)",
    ornament: "#F5A623",
    ornamentOpacity: 0.55,
  },
  blue: {
    bg: "linear-gradient(180deg,#071020 0%,#0B1118 50%,#071020 100%)",
    glow: "rgba(228,177,90,0.12)",
    text: "linear-gradient(180deg,#F5D98A 0%,#E4B15A 55%,#A87A28 100%)",
    ornament: "#E4B15A",
    ornamentOpacity: 0.55,
  },
};

function buildHtml(size, palette) {
  const p = PALETTES[palette];
  const fontSize = Math.round(size * 0.102);
  const gap      = Math.round(size * 0.031);
  const ornWidth = Math.round(size * 0.547);
  const starSize = Math.round(size * 0.027);
  const lineH    = Math.max(1, Math.round(size * 0.002));
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@700&display=block" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{
    width:${size}px;height:${size}px;overflow:hidden;
    display:flex;align-items:center;justify-content:center;
    background:${p.bg};position:relative;
  }
  .glow{
    position:absolute;width:70%;height:70%;border-radius:50%;
    background:radial-gradient(circle,${p.glow} 0%,transparent 70%);
    pointer-events:none;
  }
  .inner{
    position:relative;z-index:1;
    display:flex;flex-direction:column;align-items:center;gap:${gap}px;
  }
  .ornament{
    display:flex;align-items:center;gap:${Math.round(size*0.027)}px;width:${ornWidth}px;
  }
  .ornament-line{flex:1;height:${lineH}px;background:${p.ornament};opacity:${p.ornamentOpacity};}
  .ornament svg{width:${starSize}px;height:${starSize}px;fill:${p.ornament};opacity:${p.ornamentOpacity + 0.15};flex-shrink:0;}
  .wordmark{
    font-family:'Cinzel',serif;font-size:${fontSize}px;font-weight:700;
    background:${p.text};
    -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
    letter-spacing:0.14em;line-height:1;text-align:center;white-space:nowrap;
  }
</style>
</head>
<body>
  <div class="glow"></div>
  <div class="inner">
    <div class="ornament">
      <div class="ornament-line"></div>
      <svg viewBox="0 0 10 10"><polygon points="5,0.5 6.3,3.8 9.8,3.8 7.1,6 8.1,9.5 5,7.4 1.9,9.5 2.9,6 0.2,3.8 3.7,3.8"/></svg>
      <div class="ornament-line"></div>
    </div>
    <div class="wordmark">ATTASBIH</div>
    <div class="ornament">
      <div class="ornament-line"></div>
      <svg viewBox="0 0 10 10"><polygon points="5,0.5 6.3,3.8 9.8,3.8 7.1,6 8.1,9.5 5,7.4 1.9,9.5 2.9,6 0.2,3.8 3.7,3.8"/></svg>
      <div class="ornament-line"></div>
    </div>
  </div>
</body>
</html>`;
}

// iOS xcassets alternate imagesets
const IOS_XCASSETS = "ios/App/App/Assets.xcassets";
const ANDROID_RES  = "android/app/src/main/res";

// Android mipmap density sizes
const ANDROID_SIZES = [
  { folder: "mipmap-mdpi",    size: 48  },
  { folder: "mipmap-hdpi",    size: 72  },
  { folder: "mipmap-xhdpi",   size: 96  },
  { folder: "mipmap-xxhdpi",  size: 144 },
  { folder: "mipmap-xxxhdpi", size: 192 },
];

const TARGETS = [
  // ── Default icon (light) ─────────────────────────────────────────────────
  { out: `${IOS_XCASSETS}/AppIcon.appiconset/AppIcon-512@2x.png`, size: 1024, palette: "default" },
  { out: "public/icon-512.png",         size: 512,  palette: "default" },
  { out: "public/icon-192.png",         size: 192,  palette: "default" },
  { out: "public/apple-touch-icon.png", size: 180,  palette: "default" },
  ...ANDROID_SIZES.map(({ folder, size }) => ({
    out: `${ANDROID_RES}/${folder}/ic_launcher.png`, size, palette: "default",
  })),

  // ── Dark alternate ───────────────────────────────────────────────────────
  { out: `${IOS_XCASSETS}/AppIconDark.imageset/AppIconDark.png`, size: 1024, palette: "dark" },
  ...ANDROID_SIZES.map(({ folder, size }) => ({
    out: `${ANDROID_RES}/${folder}/ic_launcher_dark.png`, size, palette: "dark",
  })),

  // ── Blue alternate ───────────────────────────────────────────────────────
  { out: `${IOS_XCASSETS}/AppIconBlue.imageset/AppIconBlue.png`, size: 1024, palette: "blue" },
  ...ANDROID_SIZES.map(({ folder, size }) => ({
    out: `${ANDROID_RES}/${folder}/ic_launcher_blue.png`, size, palette: "blue",
  })),
];

const browser = await chromium.launch();

for (const { out, size, palette } of TARGETS) {
  const page = await browser.newPage();
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(buildHtml(size, palette), { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  const outPath = path.join(ROOT, out);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  await page.screenshot({ path: outPath, type: "png" });
  await page.close();
  console.log(`✓ [${palette.padEnd(7)}] ${size}x${size} → ${out}`);
}

await browser.close();

// Write imageset Contents.json for each iOS alternate
for (const [name, file] of [["AppIconDark", "AppIconDark.png"], ["AppIconBlue", "AppIconBlue.png"]]) {
  const contents = {
    images: [{ filename: file, idiom: "universal", scale: "1x" }],
    info: { author: "xcode", version: 1 },
    properties: { "pre-rendered": true },
  };
  const dir = path.join(ROOT, IOS_XCASSETS, `${name}.imageset`);
  fs.writeFileSync(path.join(dir, "Contents.json"), JSON.stringify(contents, null, 2));
  console.log(`✓ Wrote ${name}.imageset/Contents.json`);
}

console.log("\n✅ All icons generated.");
