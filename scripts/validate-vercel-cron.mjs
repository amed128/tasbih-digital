import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const vercelPath = path.join(root, "vercel.json");

function isTooFrequentForHobby(cron) {
  const trimmed = cron.trim();

  // Vercel cron format: "min hour day month weekday".
  const parts = trimmed.split(/\s+/);
  if (parts.length !== 5) {
    return { invalid: true, reason: "Cron expression must have 5 fields" };
  }

  const [min, hour, day, month, weekday] = parts;

  // Hobby supports at most once per day.
  // Daily-safe shape requires fixed minute + fixed hour + wildcard day/month/weekday.
  const isFixedNumber = (v) => /^\d+$/.test(v);
  const dailySafe =
    isFixedNumber(min) &&
    isFixedNumber(hour) &&
    day === "*" &&
    month === "*" &&
    weekday === "*";

  return {
    invalid: false,
    tooFrequent: !dailySafe,
    reason: dailySafe
      ? ""
      : "Hobby plan only allows daily cron schedules like '0 9 * * *'",
  };
}

async function main() {
  let parsed;
  try {
    const raw = await fs.readFile(vercelPath, "utf8");
    parsed = JSON.parse(raw);
  } catch (error) {
    console.error("[validate:vercel] Failed to read vercel.json:", error instanceof Error ? error.message : error);
    process.exit(1);
  }

  const crons = Array.isArray(parsed?.crons) ? parsed.crons : [];
  for (const cronItem of crons) {
    const schedule = cronItem?.schedule;
    if (typeof schedule !== "string") {
      console.error("[validate:vercel] Invalid cron item: missing string schedule");
      process.exit(1);
    }

    const result = isTooFrequentForHobby(schedule);
    if (result.invalid) {
      console.error(`[validate:vercel] Invalid schedule '${schedule}': ${result.reason}`);
      process.exit(1);
    }

    if (result.tooFrequent) {
      console.error(`[validate:vercel] Schedule '${schedule}' is too frequent for Vercel Hobby. ${result.reason}`);
      process.exit(1);
    }
  }

  console.log("[validate:vercel] OK");
}

main();
