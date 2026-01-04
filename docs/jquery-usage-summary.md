# jQuery Usage Summary

## Overview

This document provides a comprehensive summary of jQuery usage across the Monkeytype codebase to support the migration to native DOM utilities.

## Statistics

| Metric | Value |
|--------|-------|
| Total files using jQuery | 59 |
| Total jQuery calls | 779+ |
| Auto-injection mechanism | Vite plugin (`frontend/src/ts/vite/jquery-inject.ts`) |

## jQuery Methods Distribution

| Category | Method | Approximate Count | Description |
|----------|--------|-------------------|-------------|
| **Class Manipulation** | `.addClass()` | 200+ | Add CSS classes |
| | `.removeClass()` | 180+ | Remove CSS classes |
| | `.toggleClass()` | 50+ | Toggle CSS classes |
| | `.hasClass()` | 100+ | Check for class existence |
| **Content** | `.text()` | 150+ | Get/set text content |
| | `.html()` | 120+ | Get/set HTML content |
| | `.val()` | 80+ | Get/set input values |
| **DOM Insertion** | `.append()` | 100+ | Append child elements |
| | `.prepend()` | 30+ | Prepend child elements |
| | `.empty()` | 80+ | Clear element contents |
| | `.remove()` | 40+ | Remove elements from DOM |
| **Attributes** | `.attr()` | 150+ | Get/set attributes |
| | `.prop()` | 50+ | Get/set properties |
| | `.data()` | 30+ | Get/set data attributes |
| **Traversal** | `.find()` | 200+ | Find descendant elements |
| | `.eq()` | 30+ | Select element by index |
| | `.children()` | 20+ | Get child elements |
| **Events** | `.on()` | 100+ | Attach event handlers |
| | `.trigger()` | 20+ | Trigger events programmatically |
| **Styling** | `.css()` | 53 | Get/set inline styles |

---

## Files by jQuery Usage

### Heavy Usage (40+ calls)

These files have significant jQuery dependencies and will require substantial refactoring effort.

| File | Calls | Primary Use |
|------|-------|-------------|
| `frontend/src/ts/test/result.ts` | 109 | Test results display and statistics |
| `frontend/src/ts/test/test-ui.ts` | 84 | UI updates during test execution |
| `frontend/src/ts/modals/custom-text.ts` | 49 | Custom text modal with input controls |
| `frontend/src/ts/test/test-screenshot.ts` | 45 | Screenshot capture functionality |
| `frontend/src/ts/test/test-config.ts` | 45 | Test configuration modal |
| `frontend/src/ts/modals/edit-preset.ts` | 45 | Preset editing form controls |
| `frontend/src/ts/elements/settings/theme-picker.ts` | 44 | Theme color picker with dynamic styling |

### Medium Usage (15-40 calls)

| File | Calls | Primary Use |
|------|-------|-------------|
| `frontend/src/ts/test/test-logic.ts` | 27 | Core test execution logic |
| `frontend/src/ts/modals/quote-approve.ts` | 25 | Quote approval workflow |
| `frontend/src/ts/modals/word-filter.ts` | 24 | Word filtering interface |
| `frontend/src/ts/elements/account/result-filters.ts` | 22 | Result filtering controls |
| `frontend/src/ts/modals/simple-modals.ts` | 21 | Simple modal dialogs |
| `frontend/src/ts/event-handlers/test.ts` | 20 | Test event handling |
| `frontend/src/ts/modals/quote-rate.ts` | 17 | Quote rating interface |
| `frontend/src/ts/modals/quote-search.ts` | 16 | Quote search functionality |
| `frontend/src/ts/elements/profile.ts` | 15 | User profile display |
| `frontend/src/ts/modals/quote-submit.ts` | 14 | Quote submission form |

### Light Usage (5-15 calls)

| File | Calls | Primary Use |
|------|-------|-------------|
| `frontend/src/ts/modals/mobile-test-config.ts` | ~12 | Mobile test configuration |
| `frontend/src/ts/modals/share-custom-theme.ts` | ~8 | Theme sharing |
| `frontend/src/ts/event-handlers/account.ts` | 7 | Account page event handlers |
| `frontend/src/ts/modals/dev-options.ts` | ~5 | Developer options modal |

### Minimal Usage (1-4 calls) - Priority Migration Targets

These files are ideal starting points for migration as they have minimal jQuery dependencies.

| File | Calls | Primary Use |
|------|-------|-------------|
| `frontend/src/ts/event-handlers/keymap.ts` | 1 | Keymap layout click handler |
| `frontend/src/ts/event-handlers/login.ts` | 1 | Login page event delegation |
| `frontend/src/ts/test/funbox/memory-funbox-timer.ts` | 1 | Memory funbox timer hide |
| `frontend/src/ts/states/connection.ts` | 1 | Connection state banner control |
| `frontend/src/ts/test/pb-crown.ts` | 2 | Personal best crown display |
| `frontend/src/ts/elements/settings/account-settings-notice.ts` | 3 | Settings notice dismissal |
| `frontend/src/ts/elements/version-button.ts` | 3 | Version indicator updates |
| `frontend/src/ts/test/out-of-focus.ts` | 4 | Focus/blur state handling |
| `frontend/src/ts/modals/share-test-settings.ts` | 4 | Test settings sharing |
| `frontend/src/ts/test/focus.ts` | 1 | Document mousemove handler |
| `frontend/src/ts/popups/video-ad-popup.ts` | 1 | Video ad button handler |

---

## jQuery Auto-Injection

The codebase uses a Vite plugin to automatically inject jQuery imports:

**Location**: `frontend/src/ts/vite/jquery-inject.ts`

**Behavior**:
- Scans TypeScript files for `$(` or `jQuery(` patterns
- Automatically adds `import $ from "jquery"` when detected
- Reduces boilerplate in source files

**Note**: jQuery is only loaded in development environments (see `frontend/src/ts/index.ts` lines 103-105).

---

## Primary jQuery Use Cases

1. **DOM Class Manipulation** - Adding/removing CSS classes for UI state changes (hidden, active, blurred, etc.)
2. **Content Updates** - Setting text, HTML, and input values dynamically
3. **Event Delegation** - Attaching handlers to parent elements for dynamically created children
4. **Modal/Popup Interactions** - Form controls, validation, and display toggling
5. **Element Creation** - Building and inserting HTML fragments
6. **Form Value Management** - Getting and setting input, select, and textarea values

---

## Migration Approach

### Recommended Order

1. **Phase 1**: Single-call files (establish patterns)
2. **Phase 2**: 2-4 call files (validate patterns)
3. **Phase 3**: Event handler files (5-10 calls)
4. **Phase 4**: Small modals (10-20 calls)
5. **Phase 5**: Medium complexity files (20-40 calls)
6. **Phase 6**: Heavy usage files (40+ calls)

### See Also

- [Isolated Components PRD](./jquery-isolated-components-prd.md) - Detailed migration specifications for priority files
