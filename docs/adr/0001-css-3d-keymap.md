# The 3d keymap is built with CSS 3D transforms, not WebGL

The keymap can be rendered in 3d (`keymapDimension: "3d"`). We render it with
CSS 3D transforms (a perspective, a tilted board of keycap slabs) instead of a
WebGL scene (three.js), even though a real 3d scene was the original request.

WebGL was rejected because it would have replaced the keymap's best properties:
DOM text stays crisp and themed for free, the whole component reuses the existing
2d flash/next logic and theme colors, and there is no heavyweight rendering
dependency to load for a widget that sits under the test. The cost is a
foreshortened, clamped view rather than a free orbit: the pose is
rotateX/rotateZ with clamped ranges so keys never show their undersides. If a
fully orbitable scene is wanted later, the `Keymap3D` component is the seam to
replace; the settings and data contract (`KeyboardDefinition`, flash state)
stay the same.
