# Monkeytype

A typing test website: users take typing tests, and signed-in users keep their results, settings and profile.

## Navigation

**Page**:
One screen of the site (test, settings, account, about...). Only one page is on screen at a time.
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
