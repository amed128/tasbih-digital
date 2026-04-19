/**
 * Generates all app icons (iOS + PWA) from the Cinzel wordmark design.
 * Run: node scripts/generate-app-icon.mjs
 */

import { chromium } from "playwright";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const TARGETS = [
  { out: "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png", size: 1024 },
  { out: "public/icon-512.png",         size: 512 },
  { out: "public/icon-192.png",         size: 192 },
  { out: "public/apple-touch-icon.png", size: 180 },
];

function buildHtml(size) {
  const fontSize  = Math.round(size * 0.102);
  const gap       = Math.round(size * 0.031);
  const ornWidth  = Math.round(size * 0.547);
  const starSize  = Math.round(size * 0.027);
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
    background:linear-gradient(180deg,#04291E 0%,#064E3B 50%,#04291E 100%);
    position:relative;
  }
  .glow{
    position:absolute;width:70%;height:70%;border-radius:50%;
    background:radial-gradient(circle,rgba(10,90,65,0.65) 0%,transparent 70%);
    pointer-events:none;
  }
  .inner{
    position:relative;z-index:1;
    display:flex;flex-direction:column;align-items:center;gap:${gap}px;
  }
  .ornament{
    display:flex;align-items:center;gap:${Math.round(size*0.027)}px;width:${ornWidth}px;
  }
  .ornament-line{flex:1;height:${Math.max(1,Math.round(size*0.002))}px;background:#FDE68A;opacity:0.4;}
  .ornament svg{width:${starSize}px;height:${starSize}px;fill:#FDE68A;opacity:0.75;flex-shrink:0;}
  .wordmark{
    font-family:'Cinzel',serif;font-size:${fontSize}px;font-weight:700;
    background:linear-gradient(180deg,#FFF3C4 0%,#FDE68A 55%,#C49A22 100%);
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

const browser = await chromium.launch();

for (const { out, size } of TARGETS) {
  const page = await browser.newPage();
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(buildHtml(size), { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  const outPath = path.join(ROOT, out);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  await page.screenshot({ path: outPath, type: "png" });
  await page.close();
  console.log(`✓ ${size}x${size} → ${out}`);
}

await browser.close();
