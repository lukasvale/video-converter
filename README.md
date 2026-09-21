# LT Advert Video Converter

A browser-based tool that converts videos and images into MP4 files at fixed ad sizes. Everything runs client-side with [ffmpeg.wasm](https://github.com/ffmpegwasm/ffmpeg.wasm), so files are never uploaded to a server.

## Features

- Batch upload of videos and images by drag and drop or file picker
- Multiple output sizes per file in one run
- Images become 10 second MP4 clips
- "Static Frame" mode turns a chosen video frame into a 10 second still clip
- Optional audio removal and a 10 second maximum length
- Crop to fill, or letterbox with black bars
- Video preview and download of single files or all results

## Output formats

| Size | Aspect ratio |
|---|---|
| 288x432 | 2:3 |
| 320x160 | 2:1 |
| 480x240 | 2:1 |
| 480x270 | 16:9 |
| 480x288 | 5:3 |
| 512x256 | 2:1 |
| 576x288 | 2:1 |
| 672x336 | 2:1 |
| 720x360 | 2:1 |
| 720x480 | 3:2 |
| 768x384 | 2:1 |
| 800x400 | 2:1 |
| 840x360 | 7:3 |
| 864x432 | 2:1 |
| 896x448 | 2:1 |
| 960x480 | 2:1 |
| 960x576 | 5:3 |
| 1900x950 | 2:1 |

Output is H.264 (baseline profile, level 3.0) at 25 fps with `+faststart`.

## Getting started

Requires Node.js 18 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:3000. To build for production:

```bash
npm run build
npm start
```

## Using it in another app

The whole converter is one React component: [`components/VideoConverter.js`](components/VideoConverter.js). It includes its own styles and loads ffmpeg.wasm from a CDN at runtime, so it has no extra npm dependencies beyond React.

To reuse it:

1. Copy `components/VideoConverter.js` into your project.
2. Render it on the client only. In Next.js, use `dynamic(() => import(...), { ssr: false })` as in [`pages/index.js`](pages/index.js).
3. Add the cross-origin isolation headers from [`next.config.js`](next.config.js) to your host. ffmpeg.wasm needs `SharedArrayBuffer`, which browsers only enable with:
   ```
   Cross-Origin-Opener-Policy: same-origin
   Cross-Origin-Embedder-Policy: require-corp
   ```
4. To change the sizes, edit the `availableFormats` array at the top of the component.
5. To change the title, edit the `<h1>` in the component's return block.

## Project structure

```
components/VideoConverter.js   Converter UI, ffmpeg logic and styles
pages/index.js                 Page wrapper (client-only render, global styles)
next.config.js                 Cross-origin isolation headers
```

## Deployment

The project is deployed on Vercel, and pushes to `main` deploy to production automatically.

## Notes

- ffmpeg.wasm (`@ffmpeg/ffmpeg@0.11.6`) and its core are fetched from jsDelivr, so the first load needs internet access.
- Large files and many format combinations use a lot of browser memory. Convert in smaller batches if the tab slows down.
