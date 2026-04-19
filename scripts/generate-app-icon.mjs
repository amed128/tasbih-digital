/**
 * Generates the iOS app icon (1024x1024 PNG) from the Cinzel wordmark design.
 * Run: node scripts/generate-app-icon.mjs
 */

import { chromium } from "playwright";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

const OUT_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png"
);

const SIZE = 1024;

const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@700&display=block" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{
    width:${SIZE}px;height:${SIZE}px;overflow:hidden;
    display:flex;align-items:center;justify-content:center;
    background:linear-gradient(180deg,#04291E 0%,#064E3B 50%,#04291E 100%);
    position:relative;
  }
  .glow{
    position:absolute;
    width:70%;height:70%;
    border-radius:50%;
    background:radial-gradient(circle,rgba(10,90,65,0.65) 0%,transparent 70%);
    pointer-events:none;
  }
  .inner{
    position:relative;z-index:1;
    display:flex;flex-direction:column;align-items:center;gap:32px;
  }
  .ornament{
    display:flex;align-items:center;gap:28px;width:560px;
  }
  .ornament-line{flex:1;height:2px;background:#FDE68A;opacity:0.4;}
  .ornament svg{width:28px;height:28px;fill:#FDE68A;opacity:0.75;flex-shrink:0;}
  .wordmark{
    font-family:'Cinzel',serif;font-size:104px;font-weight:700;
    background:linear-gradient(180deg,#FFF3C4 0%,#FDE68A 55%,#C49A22 100%);
    -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
    letter-spacing:0.14em;line-height:1;text-align:center;
    white-space:nowrap;
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

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: SIZE, height: SIZE });
await page.setContent(html, { waitUntil: "networkidle" });

// Extra wait to ensure Google Fonts finishes loading
await page.waitForTimeout(1500);

fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
await page.screenshot({ path: OUT_PATH, type: "png" });
await browser.close();

console.log(`✓ App icon saved → ${OUT_PATH}`);
