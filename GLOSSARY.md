# Monkeytype

A typing test website: users take typing tests, and signed-in users keep their results, settings and profile.

## Navigation

**Page**:
One screen of the site, shown for one route (test, settings, account, about...). Only one page is on screen at a time.
_Avoid_: view, screen, route (a route is the URL that selects a page)

**Test page**:
The page where the typing test is taken. Leaving it ends any test in progress.

**Page fade**:
The change from one page to the next: the old page fades out completely, then the new page fades in. Two pages are never visible at once.
_Avoid_: crossfade, page transition

**Loading page**:
The page shown instead of a page while what it needs is still loading, or when loading it failed.
_Avoid_: loading screen, splash

**Loading bar**:
The progress bar on the loading page. One navigation fills one loading bar, from empty to "Done".

**Loading step**:
One load within a navigation that fills its share of the loading bar, eg. downloading the user data or downloading results.
_Avoid_: bar load, loading stage, keyframe

## Page data

**Blocking data**:
Data a page is useless without. Navigating to the page waits for it, showing the loading page with a loading step.
_Avoid_: critical data, required data

**Background data**:
Data a page shows after the page has appeared; each part of the page that needs it shows its own loader until it arrives.
_Avoid_: lazy data, deferred data, non-critical data

## Typing test

**Typo hint**:
The small character shown under a mistyped letter when typos are indicated below: what was typed, or what was expected when the typed letter replaces the word's letter.
_Avoid_: hint (alone), typo indicator

**Merged typo hint**:
One typo hint covering several adjacent mistyped letters on the same line, shown when their separate hints would overlap.
_Avoid_: joined hint (joining is the joining-script feature)

**Line jump**:
When the active word moves down a line, the top visible line scrolls up out of view, so the active line stays at the same height. Happens only when not all lines are shown.
_Avoid_: line scroll, removing lines

**Tape mode**:
The words run along one line and scroll sideways instead of wrapping into lines. Typed words that scroll off the edge are hidden.

**Tape scroll**:
The sideways movement in tape mode that keeps the active word (or letter) at the tape margin.
_Avoid_: tape jump, removing words
