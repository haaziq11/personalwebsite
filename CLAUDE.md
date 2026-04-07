# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development

This is a static site with no build step. Open `index.html` directly in a browser, or serve it locally:

```bash
npx serve .
# or
python -m http.server
```

A local server is required (not just file:// open) because `main.js` uses ES module imports with an import map pointing to `three` via unpkg CDN.

## Architecture

Three files, no framework:

- **`index.html`** — shell with an import map resolving `"three"` to unpkg CDN. Holds the `<canvas id="c">`, a HUD hint overlay, and a hidden `<main class="content">` bio section.
- **`main.js`** — all logic. Uses Three.js (ES module, no bundler). Two distinct phases:
  1. **Intro phase**: A 3D Discraft Ultrastar frisbee floats over a procedural grass ground. Scroll/swipe drives `scrollProgressTarget` → `scrollProgress` (smoothed via exponential decay). Progress controls disc scale (0.85→12.8×) and camera Z position, creating a zoom-in effect.
  2. **Reveal phase**: At `REVEAL_AT = 0.82` progress the canvas hides, the content div fades in, and the page switches to normal scrolling (`overflow: auto`). This is a one-way transition.
  - The disc geometry is a `LatheGeometry` revolved from `discProfilePoints()`. Top art is drawn procedurally onto a `CanvasTexture`; placing an `ultrastar-top.png` in the same directory overrides it.
- **`styles.css`** — two-state layout: fixed fullscreen canvas (intro) vs. fixed fullscreen `.content` div (bio). Uses Outfit font from Google Fonts.

## Key values to know when tweaking the animation

| Constant | Location | Effect |
|---|---|---|
| `SCROLL_PER_FULL` | `main.js:287` | Scroll pixels needed for full zoom (2200) |
| `ZOOM_SMOOTHING` | `main.js:288` | Lerp speed (higher = snappier) |
| `REVEAL_AT` | `main.js:296` | Progress threshold that triggers content reveal (0.82) |
| `cameraZStart/End` | `main.js:29-30` | Camera pull-in range |
| `scaleMin/scaleMax` | `main.js:301-302` | Disc scale range |
