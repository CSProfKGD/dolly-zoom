# Dolly Zoom Demo — Working Notes

## Product intent

This is a premium single-page camera-optics explainer. Preserve the sparse Apple-keynote visual hierarchy: near-black environment, near-white type, cyan optical geometry, warm-gold depth target, hairline borders, and restrained motion. Every decorative element must help explain the camera model.

## Interaction model

- A single bottom scrubber owns camera travel from `Far / Tele` to `Near / Wide`.
- The thin yellow stability plane in the top-down view can be dragged along the optical axis. It defines the depth whose projected pixels remain stable and is independent from the fixed golden sphere.
- The cyan and purple top-down cube footprints use their real scene orientation. A one-button drag translates a cube; a two-button drag rotates it, with both views updating from shared state.
- “Freeze focal length” holds the current lens while the camera continues moving.
- Pointer, touch, trackpad, and arrow-key input all use the native range control.
- The one-shot autoplay cancels on any explicit interaction and is disabled for reduced motion.

## Architecture

- `src/components/DollyZoomDemo.tsx` owns canonical interaction state.
- `CameraView.tsx` renders the physical perspective camera with React Three Fiber.
- `GeometryView.tsx` derives a sharp SVG diagram from the same values.
- `DollyControl.tsx` is the compact bottom control surface; match the Learning Rate/Steerable Filters treatment with a centered translucent dock, white progress track, ringed dark thumb, tiny uppercase label, monospaced `t` readout, and a restrained inset action button. Live optical values are drawn directly in the geometry view.
- `src/lib/cameraMath.ts` is the only source for optical calculations.

Do not add independent camera state inside either visualization. Update or add math tests whenever camera conventions change.
