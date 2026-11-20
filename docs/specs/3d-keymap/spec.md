# 3d keymap

A user-requested 3d version of the keymap: the keyboard on the test page,
rendered as a tilted 3d board instead of the flat 2d grid.

## Setting

- New appearance-group setting `keymapDimension: "2d" | "3d"`, default `"2d"`.
  Old stored configs pick up the default via the usual config migration.
- Commandline: `keyboard` subgroup, options from schema.
- `triggerResize: true` (the board height differs from the 2d keymap), no
  test restart required.
- Settings page: shown with the other keymap settings (hidden while keymap
  mode is off).

## Rendering (3d)

- CSS 3D transforms, no WebGL dependency (ADR: `docs/adr/0001-css-3d-keymap.md`).
- Board: perspective container, default pose rotateX(55deg) rotateZ(-5deg).
- Drag to orbit, clamped: tilt 20–80°, rake ±30° (no free orbit: past ~90°
  keys show their undersides). Touch horizontal drag orbits the rake; vertical
  drags keep scrolling the page.
- Keys are keycap slabs: a raised top face (legend, existing theme colors and
  border), a darker front edge, on a rounded base plate with a visible edge.
  Legends lie flat on the key tops and tilt with the board (no billboarding).
- React mode: a flashed key dips (presses down) while it flashes, like 2d.
- The 3d board honors all existing keymap settings: mode, style, legend style,
  keys, size (zoom), layout, and sits where the 2d keymap does (below the
  words).

## Tests

- `packages/schemas`: `KeymapDimensionSchema` + config key.
- Frontend: config metadata/commandline registration; pose clamping; `Keymap3D`
  component (board, keycaps, first row, flash dip, steno no-dip, orbit
  clamp); `Keymap` 2d/3d branch.
