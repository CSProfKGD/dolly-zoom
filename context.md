# Implementation Context

## Camera conventions

- World optical axis is the Three.js Z axis. The golden subject begins at `x = 0, z = 0` and can translate independently on the floor plane.
- Dolly parameter: `t ∈ [0, 1]`, with `Z(t) = 16.6667 - 12.6667t` metres.
- Stable-plane compensation is `f = Z × 35 / 6`, giving 35 mm at 6 m, 23.3 mm at the 4 m midpoint, and 11.7 mm at 2 m.
- Sensor dimensions are 36 × 24 mm. Camera-view FOV is vertical: `2 atan(24 / 2f)`. The top-down frustum uses the 36 mm horizontal sensor dimension.
- The top-down cyan boundaries demarcate the actual horizontal field of view. Derive horizontal FOV from the camera panel's live aspect ratio and the shared vertical FOV, then convert the world-space frustum half-width with the same `WORLD_TO_Y` scale used for lateral object positions. Never assume a 3:2 canvas or use an arbitrary visual multiplier.
- The foreground sphere has diameter 1.7 world units at `z = 0`. The two non-sphere objects are cubes and must remain cubes: do not reinterpret, stretch, or redesign them as slabs, walls, columns, or other rectangular prisms. A nearly black shadow-catching floor grounds the objects without exposing a rectangular boundary or specular hotspot.
- The cubes bracket the sphere in depth so the perspective separation is obvious: one cube remains between the camera and the sphere (`z > 0`), while the other remains behind the sphere (`z < 0`).
- Compensation preserves `f / Z = 35 / 6` at the independently selected stable-depth plane. Both cubes can translate with one-button drag and rotate while both mouse buttons are held.
- Projected size follows the pinhole relationship `imageSize = worldSize × f / distance`. Never scale scene objects to simulate compensation.

## Visual system

- Background `#020303`; panel `#060809`; near-white `#f3f5f6`; muted cool grays.
- Cyan is reserved for the camera, the single pair of frustum boundaries, stable-depth plane, and active control state. Do not add a second set of subject-edge or aspect-ratio rays. Gold marks the subject; low-contrast gray marks fixed-world geometry.
- Gold `#ffd026` identifies the subject and focal-length value.
- System Apple font stack only. Numbers use tabular figures. Borders remain at hairline opacity.
- The page is one continuous black presentation stage: hero, cinematic scene, technical diagram, then borderless controls. All major left and right edges share one content grid.

## Motion and accessibility

- Direct slider movement is never eased; only autoplay and compensation restoration use easing.
- All controls are native buttons/ranges with visible focus rings and accessible labels.
- The SVG has a title and description. The WebGL panel has a text alternative.
- `prefers-reduced-motion` skips autoplay and minimizes transitions.

## Verification

Run `pnpm test`, `pnpm run build`, and browser checks at desktop, tablet, and mobile widths. The compensated projected-size test must remain constant across the complete slider range, while frozen focal length must change subject size.
