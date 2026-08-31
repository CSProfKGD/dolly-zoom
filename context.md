# Implementation Context

## Camera conventions

- World optical axis is the Three.js Z axis. The golden subject begins at `x = 0, z = 0` and can translate on the floor plane; the camera tracks it at the displayed relative Z distance.
- Dolly parameter: `t ∈ [0, 1]`, with `Z(t) = 16.6667 - 12.6667t` metres.
- Subject compensation is `f = 6Z`, giving 100 mm at 16.67 m, 62 mm at the 10.33 m midpoint, and 24 mm at 4 m.
- Sensor dimensions are 36 × 24 mm. Camera-view FOV is vertical: `2 atan(24 / 2f)`. The top-down frustum uses the 36 mm horizontal sensor dimension.
- The foreground sphere has diameter 1.7 world units at `z = 0`. Two 6.8-unit architectural slabs begin at `z = -10.5`, symmetrically offset left and right. The floor is matte-black with only soft contact shadowing.
- Compensation preserves `f / cameraZ = 6`. The slabs can translate and rotate on the ground plane without changing the optical model.
- Projected size follows the pinhole relationship `imageSize = worldSize × f / distance`. Never scale scene objects to simulate compensation.

## Visual system

- Background `#020303`; panel `#060809`; near-white `#f3f5f6`; muted cool grays.
- Cyan `#26c9f3` is reserved for camera/frustum/active control state.
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
