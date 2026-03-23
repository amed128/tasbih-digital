# Speech Tolerance Specification Matrix

## Design Principle
- **Simple tolerance** = recognition strictness (what word sequences are acceptable)
- **Advanced controls** = timing/UX behavior (when matches reset, how fast feedback updates)

---

## MATCHING STRICTNESS RULES (Controlled by `tolerance` parameter)

### Strict Profile
**Core Rules:**
- **Partial matching**: ❌ NOT allowed (fullMatch requires complete ordered sequence)
- **Ordered word coverage**: Require 100% of words in exact order
- **Near-miss aggressiveness**: ❌ DISABLED (only exact/prefix word matches allowed)
- **Single-word targets**: Require exact or prefix match

**Definition:**
```
- allowPartial: false
- minOrderedCoverage: 1.0 (require 100% of words)
- enableNearMissShortcut: false
- nearMissMaxLengthDiff: 0
```

### Balanced Profile
**Core Rules:**
- **Partial matching**: ✓ ALLOWED but conservative (minimum 65% of phrase length)
- **Ordered word coverage**: Require ≥75% of words in order, minimum 2 words
- **Near-miss aggressiveness**: ✓ ENABLED (lenient prefix + consonant skeleton)
- **Single-word targets**: Require ordered match OR conservative partial

**Definition:**
```
- allowPartial: true
- minOrderedCoverage: 0.75 (require 75% of words)
- minOrderedWords: 2
- enableNearMissShortcut: true
- partialMinLengthRatio: 0.65
- nearMissMaxLengthDiff: 1
```

### Tolerant Profile
**Core Rules:**
- **Partial matching**: ✓ ALLOWED permissively (minimum 50% of phrase length)
- **Ordered word coverage**: Require ≥50% of words in order, minimum 1 word
- **Near-miss aggressiveness**: ✓ ENABLED (lenient prefix + consonant skeleton)
- **Single-word targets**: Require ordered match OR permissive partial

**Definition:**
```
- allowPartial: true
- minOrderedCoverage: 0.5 (require 50% of words)
- minOrderedWords: 1
- enableNearMissShortcut: true
- partialMinLengthRatio: 0.5
- nearMissMaxLengthDiff: 1
```

---

## TIMING/UX CONTROLS (Advanced, independent of recognition strictness)

All profiles can override these via advanced settings:

```
- cooldownMs: Milliseconds before next increment allowed
  - strict default: 1200ms
  - balanced default: 800ms
  - tolerant default: 600ms

- rearmProgress: Progress threshold to reset cooldown
  - strict default: 0.18
  - balanced default: 0.28
  - tolerant default: 0.35

- bufferWindowWords: Max words to keep in phrase buffer
  - default: max(12, maxTargetWords * 2)
```

---

## PRECEDENCE RULES

1. **If advanced mode is OFF** (default):
   - Use profile-defined matching strictness + profile-defined timing
   - All values from strict/balanced/tolerant profiles apply

2. **If advanced mode is ON**:
   - Profile still defines base matching strictness (partial allowed/not, coverage %, etc.)
   - Advanced fields override ONLY timing knobs (cooldownMs, rearmProgress)
   - Matching logic always uses profile's strictness rules
   - Never silently change what counts as a "match"

3. **If a field is explicitly set in advanced mode**:
   - Override the profile default for that field ONLY
   - All other fields inherit from profile

---

## DECISION TREE (Pseudocode)

```javascript
// Step 1: Determine strictness level
const tolerance = store.preferences.speechTolerance // → "strict" | "balanced" | "tolerant"
const config = getStrictnessConfig(tolerance)

// Step 2: Override timing if advanced mode enabled
if (store.preferences.advancedTiming?.enabled) {
  if (store.preferences.advancedTiming?.cooldownMs !== undefined) {
    config.cooldownMs = store.preferences.advancedTiming.cooldownMs
  }
  if (store.preferences.advancedTiming?.rearmProgress !== undefined) {
    config.rearmProgress = store.preferences.advancedTiming.rearmProgress
  }
}

// Step 3: Apply matching logic using strictness config
const wordMatches = wordsLooselyMatch(spoken, target, config.enableNearMissShortcut)
const hasOrderedMatch = checkOrderedCoverage(spokenWords, targetWords, config)
const hasPartialMatch = config.allowPartial && checkPartialMatch(spokenWords, targetText, config)

// Step 4: Apply timing logic using final cooldownMs/rearmProgress
```

---

## CONFIG INTERFACE

```typescript
interface ToleranceStrictnessConfig {
  // Matching strictness
  allowPartial: boolean
  minOrderedCoverage: number // 0.5 to 1.0
  minOrderedWords: number    // 1 or 2
  enableNearMissShortcut: boolean
  partialMinLengthRatio: number  // 0.5 to 0.72
  nearMissMaxLengthDiff: number  // 0 or 1
}

interface ToleranceTimingConfig {
  cooldownMs: number
  rearmProgress: number
}

type SpeechTolerance = "strict" | "balanced" | "tolerant"
```

---

## Migration Path

**Current → New:**
1. Remove fields: `requiredWordRatio`, `allowContainedPartial`, `containedMinLengthRatio`
2. Add fields: `minOrderedCoverage`, `enableNearMissShortcut`, `partialMinLengthRatio`, `nearMissMaxLengthDiff`, `minOrderedWords`, `allowPartial`
3. Move `cooldownMs` and `rearmProgress` into both profiles (not removed) as defaults
4. Keep `orderedTailMatchCount()` but use new thresholds
5. Update `checkPartialMatch()` logic to use `partialMinLengthRatio` uniformly
6. Optionally disable near-miss in `wordsLooselyMatch()` based on `enableNearMissShortcut`

---

## Questions for Implementation

- Should `enableNearMissShortcut` fully disable consonant skeleton matching, or only skip it when prefix exists?
  - **Recommendation**: Skip consonant skeleton only when prefix exists (safer), full disable only in strict mode
- Should bufferWindowWords be configurable in advanced mode?
  - **Recommendation**: Not initially; keep it derived from target word count
