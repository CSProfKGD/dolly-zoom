# Implementation Context

## Camera conventions

- World optical axis is the Three.js Z axis. The golden subject stays fixed at `z = 0`; the independent stability plane moves along that axis. Displayed Z is the distance from camera to that plane.
- Dolly parameter: `t ∈ [0, 1]`, with `Z(t) = 6 - 4t` metres.
- Initial subject compensation: `f = Z × 35 / 6`, giving 35 mm at 6 m, 23.33 mm at 4 m, and 11.67 mm at 2 m.
- Sensor dimensions are 36 × 24 mm. Camera-view FOV is vertical: `2 atan(24 / 2f)`. The top-down frustum uses the 36 mm horizontal sensor dimension.
- The foreground sphere has diameter 1.04 world units at `z = 0`. A 1.22-unit cyan cube sits offset at `z = 0.65` in front, and a purple cube at `z = -1.1` behind. All three use glossy physical materials above a reflective dark floor.
- For stability-plane depth `d`, compensation preserves `f / (cameraZ - d)`. Dragging the plane updates that relationship directly without moving scene objects.
- Projected size follows the pinhole relationship `imageSize = worldSize × f / distance`. Never scale scene objects to simulate compensation.

## Visual system

- Background `#020303`; panel `#060809`; near-white `#f3f5f6`; muted cool grays.
- Cyan `#26c9f3` is reserved for camera/frustum/active control state.
- Gold `#ffd026` identifies the subject and focal-length value.
- System Apple font stack only. Numbers use tabular figures. Borders remain at hairline opacity.
- Desktop uses a teaching header beside stacked visualizations with one compact centered glass control dock at the bottom. Its treatment follows the Learning Rate/Steerable Filters controls: white slider progress, ringed dark thumb, compact monospaced readout, and inset action button. Tablet and mobile collapse to one column.

## Motion and accessibility

- Direct slider movement is never eased; only autoplay and compensation restoration use easing.
- All controls are native buttons/ranges with visible focus rings and accessible labels.
- The SVG has a title and description. The WebGL panel has a text alternative.
- `prefers-reduced-motion` skips autoplay and minimizes transitions.

## Verification

Run `pnpm test`, `pnpm run build`, and browser checks at desktop, tablet, and mobile widths. The compensated projected-size test must remain constant across the complete slider range, while frozen focal length must change subject size.
