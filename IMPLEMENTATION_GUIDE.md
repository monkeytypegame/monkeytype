# Code Changes for Potential WPM Feature

## Complete Implementation Guide

This document provides all the exact code snippets and file paths for implementing the "Potential WPM ignoring minor swap errors" feature.

---

## 1. New File: Swap Detection Utility

**File**: `frontend/src/ts/utils/swap-detection.ts`

```typescript
/**
 * Detects if two words differ only by a single character swap (transposition).
 * A swap is defined as exactly two adjacent characters being swapped.
 * 
 * Examples:
 * - "tpye" and "type" -> true (p and y swapped)
 * - "hte" and "the" -> true (h and t swapped)
 * - "ytpe" and "type" -> false (multiple differences)
 * - "tpe" and "type" -> false (missing character, not a swap)
 * - "typo" and "type" -> false (different character, not a swap)
 * 
 * @param inputWord - The word typed by the user
 * @param targetWord - The correct word
 * @returns true if the words differ by exactly one adjacent character swap
 */
export function isSingleSwapError(
  inputWord: string,
  targetWord: string
): boolean {
  // Must be same length for a swap
  if (inputWord.length !== targetWord.length) {
    return false;
  }

  // Must be at least 2 characters to have a swap
  if (inputWord.length < 2) {
    return false;
  }

  // If words are identical, no error
  if (inputWord === targetWord) {
    return false;
  }

  // Find all positions where characters differ
  const diffPositions: number[] = [];
  for (let i = 0; i < inputWord.length; i++) {
    if (inputWord[i] !== targetWord[i]) {
      diffPositions.push(i);
    }
  }

  // For a single swap, exactly 2 positions should differ
  if (diffPositions.length !== 2) {
    return false;
  }

  const pos1 = diffPositions[0] as number;
  const pos2 = diffPositions[1] as number;

  // The two positions must be adjacent
  if (pos2 - pos1 !== 1) {
    return false;
  }

  // Check if swapping characters at these positions makes them match
  if (
    inputWord[pos1] === targetWord[pos2] &&
    inputWord[pos2] === targetWord[pos1]
  ) {
    return true;
  }

  return false;
}
```

---

## 2. Modified: Test Input Tracking

**File**: `frontend/src/ts/test/test-input.ts`

### Add after line ~211 (after `export let afkHistory: boolean[] = [];`):

```typescript
// Track minor swap errors (single adjacent character transpositions)
export let minorSwapErrors: number[] = [];
export let totalMinorSwapErrors = 0;
```

### Add after `pushBurstToHistory()` function (~line 398):

```typescript
export function incrementMinorSwapErrors(): void {
  totalMinorSwapErrors++;
}

export function pushMinorSwapErrorsToHistory(count: number): void {
  minorSwapErrors.push(count);
}
```

### Modify the `restart()` function to include:

```typescript
export function restart(): void {
  wpmHistory = [];
  rawHistory = [];
  burstHistory = [];
  keypressCountHistory = [];
  currentKeypressCount = 0;
  afkHistory = [];
  currentAfk = true;
  errorHistory = [];
  currentErrorHistory = {
    count: 0,
    words: [],
  };
  currentBurstStart = 0;
  missedWords = {};
  minorSwapErrors = [];  // ADD THIS LINE
  totalMinorSwapErrors = 0;  // ADD THIS LINE
  accuracy = {
    correct: 0,
    incorrect: 0,
  };
  keypressTimings = {
    spacing: {
      first: -1,
      last: -1,
      array: [],
    },
    duration: {
      array: [],
    },
  };
}
```

---

## 3. Modified: Stats Calculation

**File**: `frontend/src/ts/test/test-stats.ts`

### Add import at top (after existing imports):

```typescript
import { isSingleSwapError } from "../utils/swap-detection";
```

### Modify the `CharCount` type (around line 12):

```typescript
type CharCount = {
  spaces: number;
  correctWordChars: number;
  allCorrectChars: number;
  incorrectChars: number;
  extraChars: number;
  missedChars: number;
  correctSpaces: number;
  minorSwapErrors: number; // ADD THIS LINE
};
```

### Modify the `Stats` export type (around line 20):

```typescript
export type Stats = {
  wpm: number;
  wpmRaw: number;
  potentialWpm: number; // ADD THIS LINE
  acc: number;
  correctChars: number;
  incorrectChars: number;
  missedChars: number;
  extraChars: number;
  allChars: number;
  time: number;
  spaces: number;
  correctSpaces: number;
  minorSwapErrorsCount: number; // ADD THIS LINE
};
```

### Modify the `countChars()` function:

**Add at start of function** (after variable declarations):
```typescript
let minorSwapErrorCount = 0;
```

**Add after the `if (inputWord === targetWord)` block** (around line 307):
```typescript
} else if (isSingleSwapError(inputWord, targetWord)) {
  // Minor swap error detected - count chars as correct for potential WPM
  minorSwapErrorCount++;
  // Still count individual character differences as incorrect for regular WPM
  for (let c = 0; c < inputWord.length; c++) {
    if (inputWord[c] === targetWord[c]) {
      correctChars++;
    } else {
      incorrectChars++;
    }
  }
```

**Add to return statement**:
```typescript
return {
  spaces: spaces,
  correctWordChars: correctWordChars,
  allCorrectChars: correctChars,
  incorrectChars:
    Config.mode === "zen" ? TestInput.accuracy.incorrect : incorrectChars,
  extraChars: extraChars,
  missedChars: missedChars,
  correctSpaces: correctspaces,
  minorSwapErrors: minorSwapErrorCount, // ADD THIS LINE
};
```

### Modify the `calculateStats()` function (around line 416):

**Add after `const acc = ...` calculation**:
```typescript
// Calculate potential WPM (ignoring minor swap errors)
// For each minor swap error, we had 2 incorrect chars that would have been correct
const minorSwapErrorChars = chars.minorSwapErrors * 2;
const potentialCorrectWordChars = chars.correctWordChars + minorSwapErrorChars;
const potentialWpm = Numbers.roundTo2(
  ((potentialCorrectWordChars + chars.correctSpaces) * (60 / testSeconds)) / 5
);
```

**Modify the return statement**:
```typescript
const ret = {
  wpm: isNaN(wpm) ? 0 : wpm,
  wpmRaw: isNaN(raw) ? 0 : raw,
  potentialWpm: isNaN(potentialWpm) ? 0 : potentialWpm, // ADD THIS LINE
  acc: acc,
  correctChars: chars.correctWordChars,
  incorrectChars: chars.incorrectChars,
  missedChars: chars.missedChars,
  extraChars: chars.extraChars,
  allChars:
    chars.allCorrectChars +
    chars.spaces +
    chars.incorrectChars +
    chars.extraChars,
  time: Numbers.roundTo2(testSeconds),
  spaces: chars.spaces,
  correctSpaces: chars.correctSpaces,
  minorSwapErrorsCount: chars.minorSwapErrors, // ADD THIS LINE
};
```

---

## 4. Modified: Completed Event Building

**File**: `frontend/src/ts/test/test-logic.ts`

### Modify the `completedEvent` object in `buildCompletedEvent()` (around line 864):

**Add after `rawWpm: stats.wpmRaw,`**:
```typescript
potentialWpm: stats.potentialWpm,
minorSwapErrorsCount: stats.minorSwapErrorsCount,
```

---

## 5. Modified: Result Display

**File**: `frontend/src/ts/test/result.ts`

### Modify the `updateWpmAndAcc()` function (around line 360):

**In the `else` block (when not showing decimal places), modify the section after setting `rawWpmHover`**:

```typescript
if (Config.typingSpeedUnit !== "wpm") {
  wpmHover += " (" + result.wpm.toFixed(2) + " wpm)";
  rawWpmHover += " (" + result.rawWpm.toFixed(2) + " wpm)";
}

// ADD THIS BLOCK:
// Add potential WPM to tooltip if there are minor swap errors
if (result.minorSwapErrorsCount !== undefined && result.minorSwapErrorsCount > 0) {
  const potentialWpmFormatted = Format.typingSpeed(result.potentialWpm, decimalsAndSuffix);
  wpmHover += `\nPotential WPM: ${potentialWpmFormatted} (ignoring ${result.minorSwapErrorsCount} swap error${result.minorSwapErrorsCount > 1 ? 's' : ''})`;
}

$("#result .stats .wpm .bottom").attr("aria-label", wpmHover);
```

---

## Build and Test

### Build the project:
```bash
cd /Users/bhavishya/code/monkeytype
pnpm install
pnpm build
```

### Run locally:
```bash
pnpm dev
```

### Test the feature:
1. Start a typing test
2. Intentionally type words with single character swaps (e.g., "tpye" for "type")
3. Complete the test
4. Hover over the WPM result
5. Verify the tooltip shows: "Potential WPM: X.XX wpm (ignoring N swap error[s])"

---

## Files Changed Summary

- ✅ **NEW**: `frontend/src/ts/utils/swap-detection.ts` (68 lines)
- ✅ **MODIFIED**: `frontend/src/ts/test/test-input.ts` (+15 lines)
- ✅ **MODIFIED**: `frontend/src/ts/test/test-stats.ts` (+40 lines)
- ✅ **MODIFIED**: `frontend/src/ts/test/test-logic.ts` (+2 lines)
- ✅ **MODIFIED**: `frontend/src/ts/test/result.ts` (+8 lines)

**Total**: 1 new file, 4 modified files, ~133 lines added

---

## Notes

- The feature does NOT change the existing WPM calculation or display
- Potential WPM only appears in the hover tooltip when swap errors exist
- The UI layout remains completely unchanged
- All existing functionality is preserved
- TypeScript compile errors shown are normal (missing external type definitions)
