import fs from "fs";
import { PNG } from "pngjs";

const GOLD = { r: 245, g: 166, b: 35, a: 255 };
const BG = { r: 10, g: 10, b: 10, a: 255 };

function setPixel(png, x, y, color) {
  const idx = (png.width * y + x) << 2;
  png.data[idx] = color.r;
  png.data[idx + 1] = color.g;
  png.data[idx + 2] = color.b;
  png.data[idx + 3] = color.a;
}

function createIcon(size) {
  const png = new PNG({ width: size, height: size });

  // Fill background
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      setPixel(png, x, y, BG);
    }
  }

  const cx = size / 2;
  const cy = size / 2;
  const rOuter = size * 0.35;
  const rInner = size * 0.28;
  const offset = size * 0.15;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= rOuter) {
        // cut out inner circle to create crescent
        const dx2 = x - (cx + offset);
        const dy2 = y - cy;
        const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
        if (dist2 > rInner) {
          setPixel(png, x, y, GOLD);
        }
      }
    }
  }

  return png;
}

function writeIcon(size) {
  const png = createIcon(size);
  const outPath = `./public/icon-${size}.png`;
  const stream = fs.createWriteStream(outPath);
  png.pack().pipe(stream);
  stream.on("finish", () => {
    console.log(`Wrote ${outPath}`);
  });
}

function main() {
  writeIcon(192);
  writeIcon(512);
}

main();
