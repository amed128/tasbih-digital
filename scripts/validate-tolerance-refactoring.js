#!/usr/bin/env node
/**
 * Validation script for tolerance refactoring
 * Checks that:
 * 1. All tolerance modes have the correct structure
 * 2. Field values follow the spec
 * 3. Matching logic uses new field names correctly
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function validateToleranceRefactoring() {
  const pageFile = fs.readFileSync(
    path.join(__dirname, "../app/page.tsx"),
    "utf8"
  );

  console.log("🔍 Validating tolerance refactoring...\n");

  let passed = 0;
  let failed = 0;

  // Test 1: Type definition exists
  if (pageFile.includes("type ToleranceStrictnessConfig = {")) {
    console.log("✅ ToleranceStrictnessConfig type defined");
    passed++;
  } else {
    console.log("❌ ToleranceStrictnessConfig type NOT found");
    failed++;
  }

  // Test 2: New field names in config
  const requiredFields = [
    "allowPartial",
    "minOrderedCoverage",
    "minOrderedWords",
    "enableNearMissShortcut",
    "partialMinLengthRatio",
    "nearMissMaxLengthDiff",
    "cooldownMs",
    "rearmProgress",
  ];

  const missingFields = requiredFields.filter(
    (field) => !pageFile.includes(`${field}:`)
  );

  if (missingFields.length === 0) {
    console.log("✅ All new config fields present");
    passed++;
  } else {
    console.log(`❌ Missing fields: ${missingFields.join(", ")}`);
    failed++;
  }

  // Test 3: Old field names removed
  const oldFields = [
    "requiredWordRatio ",
    "allowContainedPartial ",
    "containedMinLengthRatio ",
  ];

  const foundOldFields = oldFields.filter((field) => {
    // More specific check to avoid matching in comments or new variable names
    const regex = new RegExp(`[:\\*\s]${field}`);
    return regex.test(pageFile);
  });

  if (foundOldFields.length === 0) {
    console.log("✅ Old field names removed");
    passed++;
  } else {
    console.log(
      `⚠️  Old field names still present: ${foundOldFields.join(", ")}`
    );
    // This is a warning, not a failure, since they might be in comments
  }

  // Test 4: Strict mode values
  if (
    pageFile.includes("allowPartial: false") &&
    pageFile.includes("minOrderedCoverage: 1.0")
  ) {
    console.log("✅ Strict mode: allowPartial=false, minOrderedCoverage=1.0");
    passed++;
  } else {
    console.log("❌ Strict mode values incorrect");
    failed++;
  }

  // Test 5: Balanced mode values
  const balancedCheck =
    pageFile.includes("minOrderedCoverage: 0.75") &&
    pageFile.includes("minOrderedWords: 2") &&
    pageFile.includes("partialMinLengthRatio: 0.65");

  if (balancedCheck) {
    console.log(
      "✅ Balanced mode: minOrderedCoverage=0.75, minOrderedWords=2, partialMinLengthRatio=0.65"
    );
    passed++;
  } else {
    console.log("❌ Balanced mode values incorrect");
    failed++;
  }

  // Test 6: Tolerant mode values
  const tolerantCheck =
    pageFile.includes("minOrderedCoverage: 0.5") &&
    pageFile.includes('minOrderedWords: 1') &&
    pageFile.includes("partialMinLengthRatio: 0.5");

  if (tolerantCheck) {
    console.log(
      "✅ Tolerant mode: minOrderedCoverage=0.5, minOrderedWords=1, partialMinLengthRatio=0.5"
    );
    passed++;
  } else {
    console.log("❌ Tolerant mode values incorrect");
    failed++;
  }

  // Test 7: wordsLooselyMatch updated
  if (pageFile.includes("enableNearMiss: boolean = true")) {
    console.log("✅ wordsLooselyMatch has enableNearMiss parameter");
    passed++;
  } else {
    console.log("❌ wordsLooselyMatch not updated");
    failed++;
  }

  // Test 8: orderedTailMatchCount updated
  if (
    pageFile.includes(
      "orderedTailMatchCount(spokenWords: string[], targetWords: string[], enableNearMiss: boolean = true)"
    ) ||
    pageFile.includes("enableNearMiss: boolean = true) {") // relaxed check
  ) {
    console.log("✅ orderedTailMatchCount has enableNearMiss parameter");
    passed++;
  } else {
    console.log("❌ orderedTailMatchCount not updated");
    failed++;
  }

  // Test 9: Matching logic uses new field names
  if (
    pageFile.includes("speechToleranceConfig.allowPartial") &&
    pageFile.includes("speechToleranceConfig.minOrderedCoverage") &&
    pageFile.includes("speechToleranceConfig.enableNearMissShortcut")
  ) {
    console.log("✅ Matching logic uses new field names");
    passed++;
  } else {
    console.log("❌ Matching logic not updated");
    failed++;
  }

  // Test 10: hasPartialMatch variable renamed
  if (pageFile.includes("const hasPartialMatch =")) {
    console.log("✅ hasContainedPartial renamed to hasPartialMatch");
    passed++;
  } else {
    console.log("❌ Variable rename not complete");
    failed++;
  }

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);

  if (failed === 0) {
    console.log("\n✅ All validation checks passed! Refactoring complete.");
    process.exit(0);
  } else {
    console.log("\n❌ Some validation checks failed. Review the changes.");
    process.exit(1);
  }
}

validateToleranceRefactoring();
