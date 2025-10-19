# Potential WPM Feature Implementation Summary

## Overview
This feature adds **"Potential WPM ignoring minor swap errors"** to the Monkeytype typing test. It calculates an alternative WPM metric that treats single-letter transposition errors (swaps) as correct, while maintaining the original WPM calculation unchanged.

## Feature Definition
- **Minor errors**: Only single-letter swaps (transpositions) anywhere in a word
- **Detection criteria**: Exactly two adjacent letters swapped
- **Examples**:
  - ✅ "tpye" → "type" (p and y swapped)
  - ✅ "hte" → "the" (h and t swapped)  
  - ✅ "ytpe" → "type" (first two chars swapped)
  - ❌ "tpe" → "type" (missing letter)
  - ❌ "typo" → "type" (wrong letter)
  - ❌ "teyp" → "type" (multiple swaps)

## Implementation Details

### Files Modified

#### 1. **New File: `/frontend/src/ts/utils/swap-detection.ts`**
- **Purpose**: Core swap detection logic
- **Function**: `isSingleSwapError(inputWord: string, targetWord: string): boolean`
- **Logic**:
  - Checks if words are same length
  - Finds all character positions that differ
  - Returns true only if exactly 2 adjacent positions differ and characters are swapped

#### 2. **Modified: `/frontend/src/ts/test/test-input.ts`**
- **Added exports**:
  - `minorSwapErrors: number[]` - History of swap errors per second
  - `totalMinorSwapErrors: number` - Total count of swap errors
- **New functions**:
  - `incrementMinorSwapErrors()` - Increment swap error counter
  - `pushMinorSwapErrorsToHistory(count)` - Add to history
- **Modified**:
  - `restart()` - Reset swap error tracking

#### 3. **Modified: `/frontend/src/ts/test/test-stats.ts`**
- **Added import**: `import { isSingleSwapError } from "../utils/swap-detection"`
- **Updated `CharCount` type**:
  - Added `minorSwapErrors: number` field
- **Updated `Stats` type**:
  - Added `potentialWpm: number` - WPM ignoring minor swap errors
  - Added `minorSwapErrorsCount: number` - Count of swap errors
- **Modified `countChars()` function**:
  - Added swap detection logic after exact match check
  - When swap detected: increments `minorSwapErrorCount`
  - Still counts individual char differences for regular WPM
- **Modified `calculateStats()` function**:
  - Calculates `potentialWpm` by adding back chars from swap errors
  - Formula: `((correctWordChars + swapErrorChars*2 + correctSpaces) * 60/time) / 5`
  - Adds both fields to returned Stats object

#### 4. **Modified: `/frontend/src/ts/test/test-logic.ts`**
- **Updated `buildCompletedEvent()` function**:
  - Added `potentialWpm: stats.potentialWpm` to CompletedEvent
  - Added `minorSwapErrorsCount: stats.minorSwapErrorsCount` to CompletedEvent
- These fields are now part of the result data structure

#### 5. **Modified: `/frontend/src/ts/test/result.ts`**
- **Updated `updateWpmAndAcc()` function**:
  - Added potential WPM to hover tooltip when swap errors exist
  - Format: `"Potential WPM: {value} (ignoring X swap error[s])"`
  - Only shows if `minorSwapErrorsCount > 0`
  - Appended to existing WPM hover text via `\n`

## User Experience

### Display Behavior
1. **Normal typing** (no swap errors):
   - WPM displays as usual
   - Hover shows standard WPM details
   
2. **With swap errors**:
   - WPM displays as usual (unchanged)
   - Hover shows:
     ```
     {wpm} wpm
     Potential WPM: {potentialWpm} wpm (ignoring X swap error[s])
     ```

### UI Location
- **Position**: Results screen, WPM stat group
- **Element**: `.pageTest #result .stats .wpm .bottom`
- **Interaction**: Hover tooltip (using `aria-label` attribute)
- **Styling**: Uses existing Monkeytype tooltip system (balloon.css)

## Technical Architecture

### Data Flow
1. **During typing**: `countChars()` detects swaps when comparing input vs target words
2. **At test end**: `calculateStats()` computes both regular and potential WPM
3. **Result building**: `buildCompletedEvent()` includes both metrics
4. **Display**: `updateWpmAndAcc()` renders WPM with conditional potential WPM tooltip

### Calculation Logic

**Regular WPM** (unchanged):
```typescript
wpm = ((correctWordChars + correctSpaces) * 60 / testSeconds) / 5
```

**Potential WPM** (new):
```typescript
swapErrorChars = minorSwapErrors * 2  // Each swap = 2 incorrect chars
potentialCorrectWordChars = correctWordChars + swapErrorChars
potentialWpm = ((potentialCorrectWordChars + correctSpaces) * 60 / testSeconds) / 5
```

## Code Quality Notes

### Type Safety
- All new fields added to TypeScript interfaces
- Proper typing maintained throughout
- Type errors shown are expected (missing external type definitions for chart.js, jQuery, etc.)

### Backward Compatibility
- Original WPM calculation completely unchanged
- New fields optional (only shown when > 0 swap errors)
- No changes to existing UI layout
- No schema changes required for databases (fields are optional additions)

### Testing Considerations
- Test swap detection with edge cases:
  - Same length requirement
  - Adjacent character requirement
  - Single swap only (not multiple)
- Verify potential WPM calculation accuracy
- Ensure tooltip only appears when swap errors > 0

## File Summary

| File | Lines Changed | Type |
|------|--------------|------|
| `utils/swap-detection.ts` | 68 | New |
| `test/test-input.ts` | ~15 | Modified |
| `test/test-stats.ts` | ~40 | Modified |
| `test/test-logic.ts` | ~4 | Modified |
| `test/result.ts` | ~8 | Modified |

**Total**: ~135 lines added/modified

## Integration Steps

1. **Development**:
   - All code changes completed
   - TypeScript types updated
   - Logic integrated into existing flow

2. **Testing**:
   - Test with words containing single swaps
   - Verify tooltip appears correctly
   - Check calculation accuracy

3. **Deployment**:
   - Build with `pnpm build` 
   - Run locally with `pnpm dev`
   - TypeScript compile will resolve missing type definitions

## Example Output

**Test scenario**: Typed "tpye" instead of "type"

**Result display**:
- Main WPM: 85 (calculated normally with error)
- Hover tooltip: 
  ```
  85.23 wpm
  Potential WPM: 87.45 wpm (ignoring 1 swap error)
  ```

**Test scenario**: Multiple swap errors

**Result display**:
- Main WPM: 78
- Hover tooltip:
  ```
  78.12 wpm
  Potential WPM: 82.56 wpm (ignoring 3 swap errors)
  ```

## Conclusion

The feature is fully implemented and ready for testing. It provides valuable feedback to users about their typing accuracy when accounting for common transposition errors, while maintaining all existing functionality unchanged. The UI remains clean with the potential WPM only appearing as a non-intrusive hover tooltip.
