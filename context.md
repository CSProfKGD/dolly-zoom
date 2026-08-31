# Implementation Context

## Camera conventions

- World optical axis is the Three.js Z axis. The golden subject begins at `x = 0, z = 0` and can translate independently on the floor plane.
- Dolly parameter: `t ∈ [0, 1]`, with `Z(t) = 6 - 4t` metres.
- Stable-plane compensation is `f = Z × 35 / 6`, giving 35 mm at 6 m, 23.3 mm at the 4 m midpoint, and 11.7 mm at 2 m.
- Sensor dimensions are 36 × 24 mm. Camera-view FOV is vertical: `2 atan(24 / 2f)`. The top-down frustum uses the 36 mm horizontal sensor dimension.
- The top-down cyan boundaries demarcate the actual horizontal field of view. Derive horizontal FOV from the camera panel's live aspect ratio and the shared vertical FOV, then convert the world-space frustum half-width with the same `WORLD_TO_Y` scale used for lateral object positions. Never assume a 3:2 canvas or use an arbitrary visual multiplier.
- Browser resizing may change horizontal FOV because the simulation fixes the physical vertical sensor dimension and the camera panel's live aspect ratio defines horizontal coverage. Vertical FOV and the selected-plane invariant remain unchanged; the top-down boundaries must continue to match what the WebGL camera actually shows.
- The camera translates only along its optical axis. Keep its orientation fixed on the world -Z axis, with the optical axis passing through the initial subject center; never `lookAt` a changing off-axis target during the dolly.
- Wait for a stable camera-panel resize measurement before rendering the frustum, so the geometry never paints a placeholder FOV or flashes when the page first loads.
- Project the top-down camera and its ray origin from the real world-space camera distance with the same depth transform used for the objects. Never position the ray origin decoratively.
- The foreground sphere has diameter 1.7 world units at `z = 0`. The two non-sphere objects are identical 2.1-unit cubes in both the 3D scene and top-down footprint; they must remain equal cubes and must not be reinterpreted, stretched, or redesigned as slabs, walls, columns, or other rectangular prisms. A nearly black shadow-catching floor grounds the objects without exposing a rectangular boundary or specular hotspot.
- The initial composition starts at `t = 0` with the sphere at `z = -1.9`, halfway in depth between the nearer purple cube (`z = 0.8`) and farther teal cube (`z = -4.6`). The independent stable-depth indicator also starts at the sphere center plane so the 35 mm opening frame compensates the sphere exactly; it remains independently draggable afterward. Both cubes begin in mirrored corner-forward orientations and remain user-movable.
- Compensation is exact pinhole-plane geometry: for camera position `d`, selected world-depth plane `z_s`, and any point offset `X` on that plane, `x_ndc = 2 f X / (sensorWidth (d - z_s))`. Choosing `f = (35/6)(d - z_s)` cancels depth exactly, so all points on the selected plane retain identical image coordinates. A volumetric sphere extends in front of and behind that plane, so its silhouette may change slightly from genuine perspective; do not counter-scale scene geometry to conceal that depth effect.
- Compensation preserves `f / Z = 35 / 6` at the independently selected stable-depth plane. Both cubes can translate with one-button drag and rotate while both mouse buttons are held.
- Projected size follows the pinhole relationship `imageSize = worldSize × f / distance`. Never scale scene objects to simulate compensation.

## Visual system

- Background `#020303`; panel `#060809`; near-white `#f3f5f6`; muted cool grays.
- Cyan is reserved for the camera, the single pair of frustum boundaries, stable-depth plane, and active control state. Do not add a second set of subject-edge or aspect-ratio rays. Gold marks the subject; low-contrast gray marks fixed-world geometry.
- Gold `#ffd026` identifies the subject and focal-length value.
- System Apple font stack only. Numbers use tabular figures. Borders remain at hairline opacity.
- The page is one continuous black presentation stage: hero, cinematic scene, technical diagram, then borderless controls. All major left and right edges share one content grid.
- Control hierarchy is Camera Position first, Dolly Zoom mode second, and the icon-only Play action third. Keep Camera Position and the mode switch on one strict slider-width label row; Play stays a quiet circular action beside the primary label.

## Motion and accessibility

- Direct slider movement is never eased; only autoplay and compensation restoration use easing.
- The page loads completely still. Play continues smoothly from the current camera position without snapping, then ping-pongs continuously between Near and Far until stopped. It becomes a stop control while running, and any direct interaction cancels the animation immediately.
- Play never changes the Dolly Zoom mode: when the mode is off, autoplay moves the camera while retaining the frozen focal length; when it is on, focal-length compensation remains active.
- All controls are native buttons/ranges with visible focus rings and accessible labels.
- The SVG has an accessible name and description. The WebGL panel has a text alternative.
- Keep accessible names in ARIA rather than native `title` attributes so hovering never produces browser tooltip pop-ups.
- `prefers-reduced-motion` minimizes CSS transitions; no animation runs automatically on load.

## Verification

Run `pnpm test`, `pnpm run build`, and browser checks at desktop, tablet, and mobile widths. The compensated projected-size test must remain constant across the complete slider range, while frozen focal length must change subject size.
