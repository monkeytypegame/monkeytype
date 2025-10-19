# Quick Reference: Potential WPM Feature

## What it does
Calculates an alternative WPM that treats single adjacent character swaps as correct, while keeping the original WPM unchanged.

## Examples
- ✅ "tpye" → "type" (minor swap, will improve potential WPM)
- ✅ "hte" → "the" (minor swap, will improve potential WPM)
- ❌ "tpe" → "type" (missing char, treated as regular error)
- ❌ "typo" → "type" (wrong char, treated as regular error)

## User Experience
1. **Normal display**: WPM shows as usual (e.g., "85 wpm")
2. **Hover tooltip**: Shows potential WPM if swap errors exist
   ```
   85.23 wpm
   Potential WPM: 87.45 wpm (ignoring 1 swap error)
   ```

## Files Created/Modified

| File | Status | Purpose |
|------|--------|---------|
| `utils/swap-detection.ts` | ✅ NEW | Detects single adjacent character swaps |
| `test/test-input.ts` | ✅ MODIFIED | Tracks swap error counts |
| `test/test-stats.ts` | ✅ MODIFIED | Calculates potential WPM |
| `test/test-logic.ts` | ✅ MODIFIED | Adds fields to result event |
| `test/result.ts` | ✅ MODIFIED | Displays potential WPM in tooltip |

## Key Functions

### `isSingleSwapError(input, target)` → boolean
Returns true if words differ by exactly one adjacent character swap.

### Calculation Formula
```typescript
// Regular WPM (unchanged)
wpm = ((correctWordChars + correctSpaces) * 60 / time) / 5

// Potential WPM (new)
swapChars = minorSwapErrors * 2
potentialWpm = ((correctWordChars + swapChars + correctSpaces) * 60 / time) / 5
```

## Testing Checklist
- [ ] Type "tpye" → verify detected as swap
- [ ] Type "hte" → verify detected as swap  
- [ ] Type "tpe" → verify NOT detected as swap (missing char)
- [ ] Complete test with swaps → verify tooltip appears
- [ ] Complete test without swaps → verify no tooltip
- [ ] Hover over WPM → verify potential WPM shown correctly

## Build Commands
```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Run locally
pnpm dev
```

## Implementation Status
✅ All code changes completed  
✅ Type definitions updated  
✅ Calculation logic integrated  
✅ UI tooltip implemented  
✅ Documentation created  

Ready for testing and deployment!
