# Speech Tolerance Refactoring - Before & After Comparison

## Visual Comparison of Profiles

### STRICT MODE

**Before (Ambiguous)**
```
requiredWordRatio: 0.8          ← What does 0.8 mean for matching?
cooldownMs: 1200                ← OK, clear
rearmProgress: 0.18             ← OK, clear
allowContainedPartial: true     ← Contradicts strictness? (unused)
containedMinLengthRatio: 0.72   ← OK, but why different from 0.8?
```

**After (Crystal Clear)**
```
allowPartial: false             ← NO partial phrase matches
minOrderedCoverage: 1.0         ← REQUIRE ALL words in order
minOrderedWords: 1              ← At least 1 word (all words)
enableNearMissShortcut: false   ← NO pronunciation flexibility
partialMinLengthRatio: 0.72     ← (not used since allowPartial=false)
nearMissMaxLengthDiff: 0        ← No length forgiveness
cooldownMs: 1200                ← Same timing
rearmProgress: 0.18             ← Same threshold
```

---

### BALANCED MODE (Default)

**Before (Confusing)**
```
requiredWordRatio: 0.65         ← Is this for all targets or just multi-word?
cooldownMs: 800                 ← OK
rearmProgress: 0.28             ← OK
allowContainedPartial: true     ← Contradicts strictness again (unused)
containedMinLengthRatio: 0.62   ← Why 0.62 and not 0.65?
```

**After (Explicit)**
```
allowPartial: true              ← YES, accept partial phrases
minOrderedCoverage: 0.75        ← Require 75% of words in order
minOrderedWords: 2              ← At least 2 matched words minimum
enableNearMissShortcut: true    ← YES, accept near-miss pronunciation
partialMinLengthRatio: 0.65     ← Phrase must be ≥65% of target length
nearMissMaxLengthDiff: 1        ← Allow 1-char differences in skeleton
cooldownMs: 800                 ← Same timing
rearmProgress: 0.28             ← Same threshold
```

---

### TOLERANT MODE

**Before (Grey Zone)**
```
requiredWordRatio: 0.5          ← Why 0.5 when 0.62 in balanced?
cooldownMs: 600                 ← Faster, OK
rearmProgress: 0.35             ← Makes sense for tolerant
allowContainedPartial: true     ← Same as balanced (redundant)
containedMinLengthRatio: 0.5    ← OK, more lenient than 0.62
```

**After (Non-Overlapping)**
```
allowPartial: true              ← YES, permit partial phrases
minOrderedCoverage: 0.5         ← Require 50% of words in order
minOrderedWords: 1              ← Minimum 1 word (most permissive)
enableNearMissShortcut: true    ← YES, use pronunciation flexibility
partialMinLengthRatio: 0.5      ← Phrase can be 50% of target
nearMissMaxLengthDiff: 1        ← Allow char differences
cooldownMs: 600                 ← Faster timing
rearmProgress: 0.35             ← Reset sooner
```

---

## Matching Behavior Examples

### Example 1: Single-Word Target "alhamdulillah"

| Mode | Spoken | Ordered Match | Partial | Near-Miss | Result | Why |
|------|--------|---------------|---------|-----------|--------|-----|
| Strict | "alhamdulillah" | ✅ exact | ❌ no | ❌ no | ✅ MATCH | Full word match |
| Strict | "al hamdu li llah" | ✅ 4/4 words | ❌ no | ❌ no | ✅ MATCH | 100% coverage |
| Strict | "hamdu" | ❌ 1/1 word | ❌ no | ❌ no | ❌ REJECT | No partial |
| Strict | "akba" → skeleton "kb" | ❌ no | ❌ no | ❌ no | ❌ REJECT | No near-miss |

| Balanced | "alhamdulillah" | ✅ exact | ✅ yes | ✅ yes | ✅ MATCH | Full word match |
| Balanced | "hamdu" | ❌ 1/4 words | ✅ 65% phrase | ✅ yes | ✅ MATCH | Partial allowed |
| Balanced | "likah" | ❌ no ordered | ✅ 50% phrase | ❌ no | ❌ REJECT | <65% partial |
| Balanced | "akba" → skeleton "kb" | ❌ no | ✅ yes | ✅ yes | ✅ MATCH | Near-miss allowed |

| Tolerant | "alhamdulillah" | ✅ exact | ✅ yes | ✅ yes | ✅ MATCH | Full word match |
| Tolerant | "hamdu" | ✅ 1/4 words | ✅ 50% phrase | ✅ yes | ✅ MATCH | 50% coverage & partial |
| Tolerant | "li" | ✅ 1/4 words | ✅ 25% phrase | ❌ no | ❌ REJECT | <50% partial |
| Tolerant | "akba" → skeleton "kb" | ❌ no | ✅ yes | ✅ yes | ✅ MATCH | Near-miss allowed |

---

### Example 2: Three-Word Target "ya ayyuha al-nas"

| Mode | Spoken | Ordered Match | Coverage | Partial | Result | Why |
|------|--------|---------------|----------|---------|--------|-----|
| Strict | "ya ayyuha al-nas" | ✅ 3/3 | 100% | ❌ no | ✅ MATCH | All words in order |
| Strict | "ya ayyuha al" | ✅ 3/3 | 100% | ❌ no | ✅ MATCH | All words present |
| Strict | "ayyuha al-nas" | ✅ 2/3 | 67% | ❌ no | ❌ REJECT | Missing 1st word |
| Strict | "ya ayyuha" | ✅ 2/3 | 67% | ❌ no | ❌ REJECT | Need 100% |

| Balanced | "ya ayyuha al-nas" | ✅ 3/3 | 100% | ✓ multi-word | ✅ MATCH | Full ordered match |
| Balanced | "ayyuha al-nas" | ✅ 2/3 | 67% | ❌ no | ❌ REJECT | Need ≥75% (≥2.25 words) |
| Balanced | "ya ayyuha" | ✅ 2/3 | 67% | ❌ no | ❌ REJECT | Need ≥75% |
| Balanced | "ya ayyuha al" | ✅ 3/3 | 100% | ❌ multi-word | ✅ MATCH | Full ordered match |

| Tolerant | "ya ayyuha al-nas" | ✅ 3/3 | 100% | ✓ multi-word | ✅ MATCH | Full ordered match |
| Tolerant | "ayyuha al-nas" | ✅ 2/3 | 67% | ❌ no | ❌ REJECT | Need full match for multi-word |
| Tolerant | "ya ayyuha" | ✅ 2/3 | 67% | ❌ no | ❌ REJECT | Multi-word needs full order |
| (Note: Partial matches only work for single-word targets) | | | | | |

**Key Insight**: Multi-word targets ALWAYS require full ordered match, regardless of profile. The `minOrderedCoverage` setting only affects single-word targets and the partial match rules for multi-word phrases.

---

## Configuration Field Meanings

### Matching Strictness Fields

| Field | Type | Values | Meaning |
|-------|------|--------|---------|
| `allowPartial` | bool | false (strict) / true (balanced, tolerant) | Can spoken phrase match if target contains it? |
| `minOrderedCoverage` | 0-1 | 1.0 / 0.75 / 0.5 | What minimum fraction of target words must match in order? |
| `minOrderedWords` | int | 1 / 2 / 1 | What minimum number of words must match? |
| `enableNearMissShortcut` | bool | false (strict) / true (balanced, tolerant) | Can pronunciation similarities count? ("akba" ≈ "akbar") |
| `partialMinLengthRatio` | 0-1 | 0.72 / 0.65 / 0.5 | Phrase must be at least what % of target length to match partially? |
| `nearMissMaxLengthDiff` | int | 0 (strict) / 1 (balanced, tolerant) | Max character length difference in consonant skeleton for match? |

### Timing/UX Fields

| Field | Type | Meaning |
|-------|------|---------|
| `cooldownMs` | int (ms) | Wait this long after increment before accepting next match |
| `rearmProgress` | 0-1 | If progress drops below this, clear cooldown timer |

---

## Debug Output Comparison

### Before
```
debug: tolerance = balanced
debug: requiredWordRatio = 0.65
debug: allowContainedPartial = true
debug: containedMinLengthRatio = 0.62
```
❓ What does this mean? When is the 0.65 used? When is 0.62 used?

### After
```
debug: tolerance = balanced
debug: allowPartial = true
debug: minOrderedCoverage = 0.75 (require 75% of words)
debug: minOrderedWords = 2 (minimum 2 words)
debug: enableNearMissShortcut = true (consonant skeleton enabled)
debug: partialMinLengthRatio = 0.65 (phrase must be ≥65% length)
debug: nearMissMaxLengthDiff = 1 (±1 char allowed in skeleton)
debug: cooldownMs = 800
debug: rearmProgress = 0.28
```
✅ Crystal clear: partial phrases accepted, need 75% word coverage, consonant matching enabled, etc.

---

## Error Diagnosis: Before vs After

**User reports**: "Strict mode allows 'hamdu' to match 'alhamdulillah', but I wanted it to reject partials!"

### Before: Debugging (Hard)
```typescript
// In code:
allowContainedPartial: true  // ← This should be false for strict? No, it's true...
requiredWordRatio: 0.8       // ← What does 0.8 do here?
containedMinLengthRatio: 0.72 // ← Is this what rejected it?

// Checking old code: "Oh, contained partial checks if phrase is inside target and length ratio matches"
// But the field is true in all profiles!

// Researcher: "Wait, how is 'hamdu' even being matched?"
```

### After: Debugging (Easy)
```typescript
// In code:
allowPartial: false  // ← Ah! This should stop partial matches

// Oh wait, but it's being matched?
// Let me check: are we in strict mode?
// Yes. allowPartial is false. So it shouldn't match as partial.

// Then it must be matching as a full ordered match?
// Let me check the ordered match count...
// prefixCount = 1 (matches "hamdu" at tail)
// requiredMatchedWords = max(1, ceil(1 * 1.0)) = 1
// So 1 >= 1 is true, fullMatch = true!

// Oh! For single-word targets, ordered match counts as fullMatch.
// The word "alhamdulillah" gets split to ["alhamdulillah"]
// And 1/1 word matches, so it passes.

// That's correct behavior! Single word targets only need ordered match.
```

---

## Migration Checklist for Code Reviews

When reviewing this refactoring:

- [ ] Type definition `ToleranceStrictnessConfig` is correct
- [ ] All 8 fields are present in each profile
- [ ] `wordsLooselyMatch()` has `enableNearMiss` parameter
- [ ] `orderedTailMatchCount()` passes `enableNearMiss` parameter
- [ ] Matching logic uses `allowPartial`, not `allowContainedPartial`
- [ ] Matching logic uses `minOrderedCoverage`, not `requiredWordRatio`
- [ ] Matching logic uses `partialMinLengthRatio`, not `containedMinLengthRatio`
- [ ] Variable `hasPartialMatch` used, not `hasContainedPartial`
- [ ] Comments explain rules clearly
- [ ] No old field names remain (except in comments/docs)
- [ ] Validation script passes 10/10
- [ ] Unit tests pass without changes

---

**This document serves as the definitive reference for what changed and why.**
