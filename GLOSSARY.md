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

**Test mode**:
What decides when a test ends and where its words come from: time, words, quote, zen or custom.
_Avoid_: mode (alone, for anything else: tape mode, blind mode and focus mode are settings, not test modes)

**Funbox**:
An optional modifier that changes how a test's words are generated, shown or typed. Several can be active at once.
_Avoid_: modifier, challenge (a challenge is a separate, preset test)

**Finish**:
The end of a test reached normally: the test mode's goal is met, or the typist ends a zen test.
_Avoid_: complete, end (alone)

**Fail**:
The end of a test forced by a rule the typist broke, eg. difficulty, minimum speed, minimum accuracy or minimum burst. A failed test shows its result but never saves it.
_Avoid_: abort, lose

**Result**:
What a finished or failed test produces: its stats, shown on the result screen and saved when valid.
_Avoid_: completed event, score

**Active tags**:
The tags that will be saved with the next result. They can change mid-test; the tags active when the test ends are the ones saved.
_Avoid_: selected tags, enabled tags

**Pace caret**:
A second caret that moves through the words at a target speed, for the typist to race.
_Avoid_: ghost caret, pacer

**Focus mode**:
The state while typing in which everything except the test is hidden, until the mouse moves. Not the same as being out of focus, where the test can't receive typing.
_Avoid_: zen mode (a test mode), distraction-free mode

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

**Test settings**:
The settings a test was generated with. They stay fixed for the whole test, so a changed setting shows from the next test on. Tags are not test settings: toggling a tag applies to the test in progress.
_Avoid_: test config, config snapshot

**Restart-required setting**:
A setting whose change restarts the test: the test fades out, the change applies while it's hidden, and a new test fades in. Changes made during one restart share it.
_Avoid_: restarting setting, test-affecting config

## Theming

**Theme attributes**:
The `data-ui-element`, `data-ui-state` and `data-ui-variant` attributes on themeable parts of the site, which themes and custom CSS target, plus the boolean or list attributes for facts independent of the state (`data-ui-active`, `data-ui-corrections`). Ids and class names are not part of them and can change.
_Avoid_: theme selectors, theme classes, theme hooks
