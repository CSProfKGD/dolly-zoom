# Dolly Zoom

An interactive, mathematically accurate teaching demo for the dolly zoom effect. Move the camera while focal length compensates for a selected depth plane, and compare the perspective view with synchronized top-down geometry.

## Live demos

- [GitHub Pages](https://csprofkgd.github.io/dolly-zoom/)
- [OpenAI Sites](https://dolly-zoom.csprofkgd.chatgpt.site/)

## Development

```bash
pnpm install
pnpm run dev
```

Validation:

```bash
pnpm test
pnpm run lint
pnpm run build
pnpm run build:pages
```

The camera model, coordinate conventions, interaction behavior, and visual-system decisions are documented in [`context.md`](./context.md).
