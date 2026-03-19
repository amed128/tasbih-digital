import fs from "node:fs/promises";
import path from "node:path";

async function syncPwaAssets() {
  const rootDir = process.cwd();
  const nextDir = path.join(rootDir, ".next");
  const publicDir = path.join(rootDir, "public");

  const swSource = path.join(nextDir, "sw.js");
  const swTarget = path.join(publicDir, "sw.js");

  try {
    await fs.copyFile(swSource, swTarget);
  } catch {
    console.warn("[pwa:sync] .next/sw.js not found. Skipping PWA asset sync.");
    return;
  }

  const entries = await fs.readdir(nextDir, { withFileTypes: true });
  const workboxFiles = entries
    .filter((entry) => entry.isFile() && /^workbox-.*\.js$/.test(entry.name))
    .map((entry) => entry.name);

  const publicEntries = await fs.readdir(publicDir, { withFileTypes: true });
  const staleWorkboxFiles = publicEntries
    .filter((entry) => entry.isFile() && /^workbox-.*\.js$/.test(entry.name))
    .map((entry) => entry.name)
    .filter((name) => !workboxFiles.includes(name));

  await Promise.all(
    staleWorkboxFiles.map((name) => fs.rm(path.join(publicDir, name), { force: true }))
  );

  await Promise.all(
    workboxFiles.map((name) =>
      fs.copyFile(path.join(nextDir, name), path.join(publicDir, name))
    )
  );

  console.log(
    `[pwa:sync] synced sw.js and ${workboxFiles.length} workbox asset(s) into public/`
  );
}

syncPwaAssets().catch((error) => {
  console.error("[pwa:sync] failed:", error);
  process.exitCode = 1;
});
