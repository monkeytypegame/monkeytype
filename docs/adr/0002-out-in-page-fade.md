# Page fade is an out-in switch transition around the shown page

The page fade is a Solid out-in switch transition around the shown page: the old page stays until it has faded out, then the new page is inserted and faded in, so two pages are never visible at once. The loading page is one of the switched pages, so old page → loading page → new page is one continuous fade sequence, and the loading page is skipped when a navigation needs no loading. The boot loading page appears without a fade.

## Considered Options

- **View Transitions**: rejected. The new view is captured as soon as the DOM update finishes, before slow pages (settings) have rendered, so it is captured empty and the page renders live underneath the fading old page: both are visible at once.
- **Fading page elements by hand in `page-controller`** (previous approach): replaced. It needs every page in the DOM at all times, plus a global page-transition flag that unrelated code (test start, keydown, focus) has to consult.
