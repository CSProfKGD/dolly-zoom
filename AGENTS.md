# Dolly Zoom Demo — Working Notes

## Product intent

This is a premium single-page camera-optics explainer. Preserve the sparse Apple-keynote visual hierarchy: near-black environment, near-white type, cyan optical geometry, warm-gold depth target, hairline borders, and restrained motion. Every decorative element must help explain the camera model.

## Interaction model

- A single bottom scrubber owns camera travel from `Far / Tele` to `Near / Wide`.
- The gold subject begins at world `x = 0, z = 0` and can be dragged independently on the top-down floor plane.
- The cyan stable-depth plane is independently draggable and defines the depth whose projected pixels remain stable.
- The teal and purple cube footprints use their real scene orientation. A one-button drag translates a cube; holding both mouse buttons while dragging rotates it. Both views update from shared state.
- “Freeze focal length” holds the current focal length while the camera continues moving.
- Pointer, touch, trackpad, and arrow-key input all use the native range control.
- The one-shot autoplay cancels on any explicit interaction and is disabled for reduced motion.

## Architecture

- `src/components/DollyZoomDemo.tsx` owns canonical interaction state.
- `CameraView.tsx` renders the physical perspective camera with React Three Fiber.
- `GeometryView.tsx` derives a sharp SVG diagram from the same values.
- `DollyControl.tsx` is the minimal, borderless bottom control surface with a thin cyan progress track, precise thumb, inline optical readout, and secondary focal-length toggle.
- `src/lib/cameraMath.ts` is the only source for optical calculations.

Do not add independent camera state inside either visualization. Update or add math tests whenever camera conventions change.
