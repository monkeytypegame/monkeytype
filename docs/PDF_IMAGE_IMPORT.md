# Custom Text: PDF & Image Import

Import a document or image as a custom typing test. Text is extracted
**entirely on the device** — the file never leaves the browser.

## How to use

1. Typing page → mode row → **custom**, then **change** (opens the Custom Text
   modal) — or click **upload** next to the `custom` mode button for direct access.
2. Pick a `.txt`, `.pdf`, or image (`.png`, `.jpg`, `.jpeg`, `.webp`, `.bmp`).
3. Text is extracted (OCR for scans/images), cleaned, and loaded as the test.

## Pipeline

```
Upload → file kind → extract → clean → custom text → typing test
```

- **PDF with a text layer** → read with pdf.js
- **Scanned PDF / image** → rendered to canvas and recognized with Tesseract (OCR)
- **Cleaning** → unwrap lines, repair hyphenated words, keep paragraphs, drop
  page numbers, expand ligatures

## Server dependency

**None.** Fully on-device:

- No `backend/`, contracts, or schemas changes — frontend only.
- No `fetch`/XHR/external URLs in the feature code.
- pdf.js / Tesseract runtime assets are served from our **own origin**
  (`/vendor/...`, via `vite-plugins/vendor-assets.ts`), never a CDN.

## Stats

### Code

| | Lines | Files |
|---|---|---|
| Feature (extraction, cleaning, modal, vendor plugin, tests) | +1686 / −20 | 14 |
| Direct `upload` button (beside `custom` mode) | +70 / −1 | 1 |

New deps: `pdfjs-dist`, `tesseract.js` (runtime), `@tesseract.js-data/eng` (dev).

### Bundle impact

All assets are **lazy-loaded** — a normal typing test downloads none of them.
A user who never imports a file pays zero.

| Asset | Size | Fetched |
|---|---|---|
| pdf.js main + worker | 783 KB + 1.4 MB | first PDF |
| pdf.js cmaps + fonts | 1.6 MB + 800 KB | PDFs needing them |
| Tesseract worker | 109 KB | first OCR |
| Tesseract WASM core | ~2.7 MB | first OCR |
| English OCR language data | 2.8 MB | first OCR |

First OCR pulls ~5.6 MB once, then cached for a year (`/vendor/**`
`Cache-Control: max-age=31536000, immutable`).

## Text tools (Custom Text modal)

Transform helpers applied to the loaded text: convert to lowercase, remove
zero-width characters, remove fancy typography, replace control characters,
replace new lines with spaces.
