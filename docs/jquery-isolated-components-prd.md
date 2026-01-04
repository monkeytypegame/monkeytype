# jQuery Migration: Isolated Components PRD

## Purpose

This document provides detailed specifications for migrating isolated components from jQuery to native DOM utilities. These components have minimal jQuery dependencies and serve as ideal starting points to establish migration patterns.

## Migration Strategy

Replace jQuery methods with native DOM APIs. Use the DOM Utility Mappings section as a reference for equivalent native implementations.

---

## Component 1: event-handlers/keymap.ts

**File**: `frontend/src/ts/event-handlers/keymap.ts`
**jQuery Calls**: 1
**Complexity**: Very Low
**Estimated Lines Changed**: ~5

### Current Implementation

```typescript
// Line 3
$("#keymap").on("click", ".r5 .layoutIndicator", async () => {
  Commandline.show({ subgroupOverride: "keymapLayouts" });
});
```

### jQuery Usage

| Line | Method | Selector | Purpose |
|------|--------|----------|---------|
| 3 | `.on()` | `#keymap` delegated to `.r5 .layoutIndicator` | Event delegation for layout indicator click |

### Migration Implementation

```typescript
document.getElementById("keymap")?.addEventListener("click", (e) => {
  if ((e.target as Element).closest(".r5 .layoutIndicator")) {
    Commandline.show({ subgroupOverride: "keymapLayouts" });
  }
});
```

### Testing Checklist
- [ ] Click on layout indicator opens commandline with keymapLayouts subgroup
- [ ] Click on other keymap areas does not trigger handler
- [ ] No console errors on page load

---

## Component 2: event-handlers/login.ts

**File**: `frontend/src/ts/event-handlers/login.ts`
**jQuery Calls**: 1
**Complexity**: Very Low
**Estimated Lines Changed**: ~5

### Current Implementation

```typescript
// Line 5
$(loginPage).on("click", "#forgotPasswordButton", () => {
  ForgotPasswordModal.show();
});
```

### jQuery Usage

| Line | Method | Selector | Purpose |
|------|--------|----------|---------|
| 5 | `.on()` | `loginPage` delegated to `#forgotPasswordButton` | Event delegation for forgot password button |

### Migration Implementation

```typescript
loginPage.addEventListener("click", (e) => {
  if ((e.target as Element).closest("#forgotPasswordButton")) {
    ForgotPasswordModal.show();
  }
});
```

### Testing Checklist
- [ ] Forgot password button opens modal
- [ ] Other login page clicks do not trigger modal
- [ ] Works when button is dynamically rendered

---

## Component 3: test/funbox/memory-funbox-timer.ts

**File**: `frontend/src/ts/test/funbox/memory-funbox-timer.ts`
**jQuery Calls**: 1
**Complexity**: Very Low
**Estimated Lines Changed**: ~3

### Current Implementation

```typescript
// Line 45
$("#wordsWrapper").addClass("hidden");
```

### jQuery Usage

| Line | Method | Selector | Purpose |
|------|--------|----------|---------|
| 45 | `.addClass()` | `#wordsWrapper` | Hide words wrapper when memory timer expires |

### Migration Implementation

```typescript
document.getElementById("wordsWrapper")?.classList.add("hidden");
```

### Testing Checklist
- [ ] Words wrapper hides when memory timer reaches zero
- [ ] No errors if element doesn't exist
- [ ] Memory funbox functions correctly end-to-end

---

## Component 4: states/connection.ts

**File**: `frontend/src/ts/states/connection.ts`
**jQuery Calls**: 1
**Complexity**: Very Low
**Estimated Lines Changed**: ~5

### Current Implementation

```typescript
// Lines 36-38
$(`#bannerCenter .psa.notice[id="${noInternetBannerId}"] .closeButton`).trigger("click");
```

### jQuery Usage

| Line | Method | Selector | Purpose |
|------|--------|----------|---------|
| 36-38 | `.trigger()` | Complex selector for close button | Programmatically close offline notification banner |

### Migration Implementation

```typescript
document
  .querySelector(`#bannerCenter .psa.notice[id="${noInternetBannerId}"] .closeButton`)
  ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
```

### Testing Checklist
- [ ] Offline banner closes when connection restored
- [ ] Event bubbles correctly to parent handlers
- [ ] No errors when banner not present

---

## Component 5: test/pb-crown.ts

**File**: `frontend/src/ts/test/pb-crown.ts`
**jQuery Calls**: 2
**Complexity**: Low
**Estimated Lines Changed**: ~15

### Current Implementation

```typescript
// Line 6 - hide()
$("#result .stats .wpm .crown").css("opacity", 0).addClass("hidden");

// Lines 41-46 - update()
const el = $("#result .stats .wpm .crown");
el.removeClass("ineligible");
el.removeClass("pending");
el.removeClass("error");
el.removeClass("warning");
el.addClass(type);
```

### jQuery Usage

| Line | Method | Selector | Purpose |
|------|--------|----------|---------|
| 6 | `.css()`, `.addClass()` | `#result .stats .wpm .crown` | Hide crown with opacity transition and class |
| 41-46 | `.removeClass()`, `.addClass()` | Same selector | Update crown type by swapping classes |

### Migration Implementation

```typescript
const crownSelector = "#result .stats .wpm .crown";

export function hide(): void {
  visible = false;
  const crown = document.querySelector(crownSelector) as HTMLElement | null;
  if (crown) {
    crown.style.opacity = "0";
    crown.classList.add("hidden");
  }
}

export function update(type: CrownType): void {
  currentType = type;
  const crown = document.querySelector(crownSelector);
  if (crown) {
    crown.classList.remove("ineligible", "pending", "error", "warning");
    crown.classList.add(type);
  }
}
```

### Testing Checklist
- [ ] Crown hides with opacity animation
- [ ] Crown updates to correct type class
- [ ] Previous type classes removed when updating
- [ ] Works for all CrownType values: ineligible, pending, error, warning

---

## Component 6: elements/settings/account-settings-notice.ts

**File**: `frontend/src/ts/elements/settings/account-settings-notice.ts`
**jQuery Calls**: 3
**Complexity**: Low
**Estimated Lines Changed**: ~10

### Current Implementation

```typescript
// Line 12 - check if already dismissed
$(".pageSettings .accountSettingsNotice").remove();

// Line 15 - attach click handler
$(".pageSettings .accountSettingsNotice .dismissAndGo").on("click", () => {
  ls.set(true);
  void navigate("/account-settings");
  $(".pageSettings .accountSettingsNotice").remove();
});
```

### jQuery Usage

| Line | Method | Selector | Purpose |
|------|--------|----------|---------|
| 12 | `.remove()` | `.pageSettings .accountSettingsNotice` | Remove notice if previously dismissed |
| 15 | `.on()` | `.dismissAndGo` button | Attach dismiss click handler |
| 18 | `.remove()` | Same selector | Remove notice after dismissal |

### Migration Implementation

```typescript
const noticeSelector = ".pageSettings .accountSettingsNotice";

if (ls.get()) {
  document.querySelector(noticeSelector)?.remove();
}

document
  .querySelector(`${noticeSelector} .dismissAndGo`)
  ?.addEventListener("click", () => {
    ls.set(true);
    void navigate("/account-settings");
    document.querySelector(noticeSelector)?.remove();
  });
```

### Testing Checklist
- [ ] Notice removed on page load if previously dismissed
- [ ] Click dismiss navigates to account settings
- [ ] Notice removed after dismissal
- [ ] Dismissed state persists across sessions

---

## Component 7: elements/version-button.ts

**File**: `frontend/src/ts/elements/version-button.ts`
**jQuery Calls**: 3
**Complexity**: Low
**Estimated Lines Changed**: ~10

### Current Implementation

```typescript
// Line 5
function setText(text: string): void {
  $("footer .currentVersion .text").text(text);
}

// Lines 10, 12
function setIndicatorVisible(state: boolean): void {
  if (state) {
    $("#newVersionIndicator").removeClass("hidden");
  } else {
    $("#newVersionIndicator").addClass("hidden");
  }
}
```

### jQuery Usage

| Line | Method | Selector | Purpose |
|------|--------|----------|---------|
| 5 | `.text()` | `footer .currentVersion .text` | Set version text display |
| 10 | `.removeClass()` | `#newVersionIndicator` | Show new version indicator |
| 12 | `.addClass()` | `#newVersionIndicator` | Hide new version indicator |

### Migration Implementation

```typescript
function setText(text: string): void {
  const el = document.querySelector("footer .currentVersion .text");
  if (el) el.textContent = text;
}

function setIndicatorVisible(state: boolean): void {
  const indicator = document.getElementById("newVersionIndicator");
  indicator?.classList.toggle("hidden", !state);
}
```

### Testing Checklist
- [ ] Version text updates correctly
- [ ] Indicator shows when new version available
- [ ] Indicator hides when dismissed or no update
- [ ] Footer displays correctly across all pages

---

## Component 8: test/out-of-focus.ts

**File**: `frontend/src/ts/test/out-of-focus.ts`
**jQuery Calls**: 4
**Complexity**: Low
**Estimated Lines Changed**: ~15

### Current Implementation

```typescript
// Lines 7-10 - hide()
export function hide(): void {
  $("#words, #compositionDisplay")
    .css("transition", "none")
    .removeClass("blurred");
  $(".outOfFocusWarning").addClass("hidden");
  Misc.clearTimeouts(outOfFocusTimeouts);
}

// Lines 18-21 - show()
export function show(): void {
  if (!Config.showOutOfFocusWarning) return;
  outOfFocusTimeouts.push(
    setTimeout(() => {
      $("#words, #compositionDisplay")
        .css("transition", "0.25s")
        .addClass("blurred");
      $(".outOfFocusWarning").removeClass("hidden");
    }, 1000),
  );
}
```

### jQuery Usage

| Line | Method | Selector | Purpose |
|------|--------|----------|---------|
| 7-9 | `.css()`, `.removeClass()` | `#words, #compositionDisplay` | Remove blur effect instantly |
| 10 | `.addClass()` | `.outOfFocusWarning` | Hide warning message |
| 18-20 | `.css()`, `.addClass()` | `#words, #compositionDisplay` | Add blur with transition |
| 21 | `.removeClass()` | `.outOfFocusWarning` | Show warning message |

### Migration Implementation

```typescript
const blurTargets = "#words, #compositionDisplay";

export function hide(): void {
  document.querySelectorAll(blurTargets).forEach((el) => {
    (el as HTMLElement).style.transition = "none";
    el.classList.remove("blurred");
  });
  document.querySelector(".outOfFocusWarning")?.classList.add("hidden");
  Misc.clearTimeouts(outOfFocusTimeouts);
}

export function show(): void {
  if (!Config.showOutOfFocusWarning) return;
  outOfFocusTimeouts.push(
    setTimeout(() => {
      document.querySelectorAll(blurTargets).forEach((el) => {
        (el as HTMLElement).style.transition = "0.25s";
        el.classList.add("blurred");
      });
      document.querySelector(".outOfFocusWarning")?.classList.remove("hidden");
    }, 1000),
  );
}
```

### Testing Checklist
- [ ] Blur appears after 1 second of focus loss
- [ ] Warning message displays with blur
- [ ] Blur removes instantly on refocus (no transition)
- [ ] Respects showOutOfFocusWarning config setting
- [ ] Works with composition display (IME input)

---

## Recommended Migration Order

| Phase | Files | Total Calls |
|-------|-------|-------------|
| 1 | `keymap.ts`, `login.ts`, `memory-funbox-timer.ts`, `connection.ts` | 4 |
| 2 | `pb-crown.ts`, `account-settings-notice.ts`, `version-button.ts`, `out-of-focus.ts` | 12 |

**Phase 1** establishes basic patterns for:
- Event delegation with `closest()`
- Single element class manipulation
- Event triggering with `dispatchEvent()`

**Phase 2** validates patterns for:
- Multiple class operations
- Inline style manipulation
- Multi-element selection with `querySelectorAll()`

---

## DOM Utility Mappings Reference

| jQuery | Native DOM | Notes |
|--------|------------|-------|
| `$(selector)` | `document.querySelector(selector)` | Returns first match or null |
| `$(selector)` (multiple) | `document.querySelectorAll(selector)` | Returns NodeList |
| `$(el).on(event, handler)` | `el.addEventListener(event, handler)` | Direct event binding |
| `$(parent).on(event, child, handler)` | Parent listener + `e.target.closest(child)` | Event delegation |
| `.addClass(cls)` | `.classList.add(cls)` | Supports multiple: `add('a', 'b')` |
| `.removeClass(cls)` | `.classList.remove(cls)` | Supports multiple: `remove('a', 'b')` |
| `.toggleClass(cls)` | `.classList.toggle(cls)` | Optional force param |
| `.toggleClass(cls, bool)` | `.classList.toggle(cls, bool)` | Force add/remove |
| `.hasClass(cls)` | `.classList.contains(cls)` | Returns boolean |
| `.text(val)` | `.textContent = val` | Sets text content |
| `.text()` | `.textContent` | Gets text content |
| `.html(val)` | `.innerHTML = val` | Security: sanitize input |
| `.val()` | `.value` | For input/select/textarea |
| `.val(val)` | `.value = val` | Set form value |
| `.attr(name)` | `.getAttribute(name)` | Get attribute |
| `.attr(name, val)` | `.setAttribute(name, val)` | Set attribute |
| `.removeAttr(name)` | `.removeAttribute(name)` | Remove attribute |
| `.prop(name)` | `el[name]` | Access property directly |
| `.data(key)` | `.dataset[key]` | Get data attribute |
| `.css(prop, val)` | `.style[prop] = val` | Set inline style |
| `.css({...})` | `Object.assign(el.style, {...})` | Set multiple styles |
| `.append(html)` | `.insertAdjacentHTML('beforeend', html)` | Insert at end |
| `.prepend(html)` | `.insertAdjacentHTML('afterbegin', html)` | Insert at start |
| `.after(html)` | `.insertAdjacentHTML('afterend', html)` | Insert after |
| `.before(html)` | `.insertAdjacentHTML('beforebegin', html)` | Insert before |
| `.remove()` | `.remove()` | Remove from DOM |
| `.empty()` | `.replaceChildren()` | Clear children (modern) |
| `.empty()` | `.innerHTML = ''` | Clear children (legacy) |
| `.find(sel)` | `.querySelector(sel)` | Find within element |
| `.find(sel)` (all) | `.querySelectorAll(sel)` | Find all within element |
| `.parent()` | `.parentElement` | Get parent |
| `.children()` | `.children` | Get child elements |
| `.trigger(event)` | `.dispatchEvent(new Event(event))` | Simple events |
| `.trigger('click')` | `.dispatchEvent(new MouseEvent('click', {bubbles: true}))` | Mouse events |
| `.show()` | `.style.display = ''` or `.classList.remove('hidden')` | Show element |
| `.hide()` | `.style.display = 'none'` or `.classList.add('hidden')` | Hide element |

---

## Success Criteria

1. All migrated files pass TypeScript compilation
2. No jQuery imports remain in migrated files
3. All testing checklists pass
4. No regression in functionality
5. Bundle size reduced (jQuery dependency removed from migrated modules)
