#!/usr/bin/env node
/**
 * Interactive AI theme generator for Tasbih Digital.
 *
 * Usage: npm run theme:generate
 *
 * You pick one anchor color + a few design knobs.
 * Claude generates the full CSS variable set.
 * Approve or refine in a loop. Apply directly to globals.css when ready.
 */

import { createInterface } from "readline/promises";
import { stdin as input, stdout as output } from "process";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import Anthropic from "@anthropic-ai/sdk";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const GLOBALS_CSS = join(ROOT, "app/globals.css");

// Load .env.local if ANTHROPIC_API_KEY not already in environment
if (!process.env.ANTHROPIC_API_KEY) {
  try {
    const env = readFileSync(join(ROOT, ".env.local"), "utf8");
    for (const line of env.split("\n")) {
      const [key, ...rest] = line.split("=");
      if (key?.trim() === "ANTHROPIC_API_KEY") {
        process.env.ANTHROPIC_API_KEY = rest
          .join("=")
          .trim()
          .replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    // No .env.local — API key must be in environment
  }
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.error(
    "\nError: ANTHROPIC_API_KEY is not set.\n" +
      "Add it to .env.local or export it in your shell:\n" +
      "  export ANTHROPIC_API_KEY=sk-ant-...\n"
  );
  process.exit(1);
}

const client = new Anthropic();

// ─── Prompt construction ──────────────────────────────────────────────────────

const VARIABLE_SEMANTICS = `
CSS variable semantics (what each var controls in the app):
  --background       Main page background — the darkest layer
  --foreground       Primary text color
  --secondary        Muted/secondary text and subtitles
  --primary          Accent color: progress ring, active states, highlights. The "soul" of the theme.
  --primary-rgb      Comma-separated R,G,B of --primary, for rgba() use
  --card             Counter card, modals, sheets — slightly lighter than background
  --border           Subtle structural dividers and card outlines
  --deco-opacity     Decorative background glow opacity (0 = none, 0.08–0.15 = subtle)
  --deco-accent-opacity  Secondary glow opacity (typically 55–70% of deco-opacity)
  --deco-primary-rgb     Glow color RGB for primary decoration (can be more vivid than --primary)
  --deco-accent-rgb      Secondary glow RGB (contrasting hue from deco-primary-rgb for richness)
  --tap-button-bg    (optional) Custom tap button background — use a gradient for special flair
  --tap-button-color (optional) Tap button text color when using a custom bg
`;

const EXISTING_THEMES = `
Existing themes (use these to calibrate quality and avoid duplication):

  blue (default): bg #0B1118, fg #ededed, primary #E4B15A (gold), card #151E29
  dark:           bg #0A0A0A, fg #ededed, primary #F5A623 (amber), card #1A1A1A
  light:          bg #F3F5F8, fg #1E2530, primary #B8822E (bronze), card #FFFFFF
  obsidian:       bg #0D0D10, fg #E6E8F0, primary #C0C8D8 (steel), card #17171D, deco: purple/indigo glows
  emerald:        bg #04291E, fg #F5F0E8, primary #7DF9CB (mint), card rgba glassmorphism, golden tap button
  midnight:       bg #071020, fg #EEF3FF, primary #D6E8FF (ice blue), card #0C1A32, carpet SVG pattern
`;

const SYSTEM_PROMPT = `You are a senior UI/UX designer specializing in premium mobile app themes. You design for a tasbih (Islamic digital prayer counter) app where the user wants themes that feel luxurious, considered, and spiritually appropriate.

${VARIABLE_SEMANTICS}
${EXISTING_THEMES}

Design rules:
- foreground must have a contrast ratio ≥ 4.5:1 against background (WCAG AA)
- secondary must be clearly de-emphasized vs foreground but still readable
- card must be visually distinct from background (not the same color)
- border must be subtle — structural, not decorative
- primaryRgb must be the exact decimal R,G,B breakdown of the --primary hex
- If decoOpacity > 0, always set a meaningful decoAccentOpacity (55–70% of decoOpacity)
- decoPrimaryRgb and decoAccentRgb can be more saturated/vivid than --primary for glow drama
- tapButtonBg/tapButtonColor: only set if the theme has a strong character that warrants a unique tap button (like emerald's golden gradient). Otherwise null.
- Generate something fresh — do not clone an existing theme.

Output ONLY a valid JSON object — no markdown fences, no explanation, no extra text. Schema:
{
  "background": "#rrggbb",
  "foreground": "#rrggbb",
  "secondary": "#rrggbb",
  "primary": "#rrggbb",
  "primaryRgb": "r, g, b",
  "card": "#rrggbb or rgba(...)",
  "border": "#rrggbb or rgba(...)",
  "decoOpacity": 0.00,
  "decoAccentOpacity": 0.00,
  "decoPrimaryRgb": "r, g, b",
  "decoAccentRgb": "r, g, b",
  "tapButtonBg": null,
  "tapButtonColor": null,
  "rationale": "2–3 sentences explaining the key design decisions"
}`;

function buildUserPrompt({ themeName, anchorColor, mood, tone, contrast, surface, previousResult, correction }) {
  let prompt =
    `Generate a premium theme named "${themeName}".\n\n` +
    `Anchor color (primary accent the user chose): ${anchorColor}\n` +
    `Mood: ${mood}\n` +
    `Tone: ${tone}\n` +
    `Contrast: ${contrast}\n` +
    `Surface style: ${surface}`;

  if (previousResult && correction) {
    prompt +=
      `\n\nPrevious generation:\n${JSON.stringify(previousResult, null, 2)}\n\n` +
      `User correction: "${correction}"\n\n` +
      `Apply the correction while keeping what was already working well.`;
  }

  return prompt;
}

// ─── Claude call ──────────────────────────────────────────────────────────────

async function callClaude(params) {
  const response = await client.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildUserPrompt(params) }],
  });

  const raw = response.content[0].text.trim();
  // Strip accidental markdown fences
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
  return JSON.parse(cleaned);
}

// ─── CSS generation ───────────────────────────────────────────────────────────

function generateCSS(themeName, vars) {
  const lines = [
    `html[data-theme="${themeName}"],`,
    `body[data-theme="${themeName}"] {`,
    `  --background: ${vars.background};`,
    `  --foreground: ${vars.foreground};`,
    `  --secondary: ${vars.secondary};`,
    `  --primary: ${vars.primary};`,
    `  --primary-rgb: ${vars.primaryRgb};`,
    `  --card: ${vars.card};`,
    `  --border: ${vars.border};`,
    `  --deco-opacity: ${Number(vars.decoOpacity).toFixed(2)};`,
  ];

  if (Number(vars.decoAccentOpacity) > 0) {
    lines.push(`  --deco-accent-opacity: ${Number(vars.decoAccentOpacity).toFixed(2)};`);
  }

  lines.push(`  --deco-primary-rgb: ${vars.decoPrimaryRgb};`);
  lines.push(`  --deco-accent-rgb: ${vars.decoAccentRgb};`);

  if (vars.tapButtonBg) {
    lines.push(`  --tap-button-bg: ${vars.tapButtonBg};`);
    lines.push(`  --tap-button-color: ${vars.tapButtonColor};`);
  }

  lines.push(`}`);
  return lines.join("\n");
}

// ─── globals.css injection ────────────────────────────────────────────────────

function applyToGlobals(themeName, cssBlock) {
  const css = readFileSync(GLOBALS_CSS, "utf8");

  // Check for duplicate
  if (css.includes(`data-theme="${themeName}"`)) {
    throw new Error(
      `Theme "${themeName}" already exists in globals.css. Choose a different name or remove it first.`
    );
  }

  // Insert before the `:root {` global block
  const rootIndex = css.indexOf("\n:root {");
  if (rootIndex === -1) {
    throw new Error("Could not find ':root {' block in globals.css.");
  }

  const newCss =
    css.slice(0, rootIndex) + "\n\n" + cssBlock + "\n" + css.slice(rootIndex);
  writeFileSync(GLOBALS_CSS, newCss, "utf8");
}

// ─── Input helpers ────────────────────────────────────────────────────────────

function isValidHex(hex) {
  return /^#[0-9A-Fa-f]{6}$/.test(hex);
}

async function pickOne(rl, label, options) {
  console.log(`\n${label}:`);
  options.forEach(([key, label]) => console.log(`  ${key}. ${label}`));
  const keys = options.map(([k]) => k);
  const defaults = options[0];
  while (true) {
    const answer = (await rl.question(`Choice [${keys.join("/")}]: `)).trim();
    const match = options.find(([k]) => k === answer);
    if (match) return match[1];
    console.log(`  → Enter ${keys.join(", ")} or press Enter for "${defaults[1]}"`);
    if (answer === "") return defaults[1];
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const rl = createInterface({ input, output });

  console.log("\n┌─────────────────────────────────────────┐");
  console.log("│   Theme Generator — Tasbih Digital  🎨   │");
  console.log("└─────────────────────────────────────────┘");
  console.log("\nPick one anchor color + a few knobs. Claude does the rest.");
  console.log("You can refine the result as many times as you want.\n");

  // Theme name
  let themeName = "";
  while (!themeName) {
    themeName = (await rl.question("Theme name (slug, e.g. rose-gold): "))
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-");
  }

  // Anchor color
  let anchorColor = "";
  while (!isValidHex(anchorColor)) {
    let raw = (
      await rl.question("Anchor color — primary accent hex (e.g. #C9A96E): ")
    ).trim();
    if (!raw.startsWith("#")) raw = "#" + raw;
    if (isValidHex(raw)) {
      anchorColor = raw;
    } else {
      console.log("  → Invalid hex. Use format #RRGGBB");
    }
  }

  // Design knobs
  const mood = await pickOne(rl, "Mood", [
    ["1", "Luxurious"],
    ["2", "Spiritual"],
    ["3", "Minimal"],
    ["4", "Bold"],
    ["5", "Serene"],
  ]);

  const tone = await pickOne(rl, "Tone", [
    ["1", "Warm"],
    ["2", "Cool"],
    ["3", "Neutral"],
  ]);

  const contrast = await pickOne(rl, "Contrast", [
    ["1", "High"],
    ["2", "Medium"],
    ["3", "Low"],
  ]);

  const surface = await pickOne(rl, "Surface", [
    ["1", "Flat"],
    ["2", "Glassmorphism"],
    ["3", "Deep shadow"],
  ]);

  console.log("\n⏳  Generating theme…\n");

  let params = {
    themeName,
    anchorColor,
    mood,
    tone,
    contrast,
    surface,
    previousResult: null,
    correction: null,
  };
  let result = null;
  let cssBlock = "";

  while (true) {
    try {
      result = await callClaude(params);
      cssBlock = generateCSS(themeName, result);
    } catch (err) {
      console.error("\n✗ Generation failed:", err.message, "\n");
      rl.close();
      process.exit(1);
    }

    console.log("─────────────────────────────────────────");
    console.log(cssBlock);
    console.log("\nRationale:", result.rationale);
    console.log("─────────────────────────────────────────\n");

    console.log("[A] Apply to globals.css   [R] Refine   [Q] Quit");
    const choice = (await rl.question("> ")).trim().toLowerCase();

    if (choice === "a") {
      try {
        applyToGlobals(themeName, cssBlock);
        console.log(`\n✓ Theme "${themeName}" added to app/globals.css\n`);
        console.log("Next steps:");
        console.log(
          `  1. Add "${themeName}" to the Theme type in store/tasbihStore.ts`
        );
        console.log(
          `  2. Add to PremiumTheme if it should be gated (same file)`
        );
        console.log(
          `  3. Add ThemeSync meta color mapping in components/ThemeSync.tsx`
        );
        console.log(`  4. Add translations for the theme name in i18n/translations.ts\n`);
      } catch (err) {
        console.error("\n✗", err.message, "\n");
      }
      break;
    } else if (choice === "r") {
      const correction = (
        await rl.question("What to change (e.g. "warmer tones, less contrast"): ")
      ).trim();
      if (!correction) {
        console.log("  → No correction entered, staying on current result.");
        continue;
      }
      params = { ...params, previousResult: result, correction };
      console.log("\n⏳  Refining…\n");
    } else {
      console.log("\nAborted — no changes made.\n");
      break;
    }
  }

  rl.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
