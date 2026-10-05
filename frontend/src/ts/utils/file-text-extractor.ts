/**
 * Extracts text from files (plain text, pdf, images) entirely on the device.
 *
 * - PDFs with a text layer are read with pdf.js.
 * - Images and PDF pages without a text layer (scans) are recognized with
 *   tesseract.js.
 *
 * Both libraries are loaded on demand and every file they need (workers, wasm,
 * language data) is served from our own origin, see
 * `vite-plugins/vendor-assets.ts`. The file never leaves the browser.
 *
 * Note on upgrading pdf.js: `Math` is frozen in `index.ts`. pdf.js 5 and newer
 * add `Math.sumPrecise` when the browser does not ship it, which throws on a
 * frozen `Math`. Newer versions have to run outside of the main thread.
 */

import type { PDFPageProxy } from "pdfjs-dist/legacy/build/pdf.mjs";
import type Tesseract from "tesseract.js";

import { vendorAssets } from "virtual:vendor-assets";

import {
  groupLinesIntoParagraphs,
  mergeBrokenParagraphs,
  PageLines,
  paragraphsToText,
  removeMarginalText,
  removePageNumbers,
  splitPlainTextIntoParagraphs,
  textItemsToLines,
  TextItemLike,
} from "./extracted-text";

export type FileKind = "text" | "pdf" | "image";

export type ExtractionProgress =
  | { stage: "loading" }
  | { stage: "reading"; page: number; pages: number }
  | {
      stage: "recognizing";
      page: number;
      pages: number;
      /** between 0 and 1 */
      progress: number;
    };

export type ExtractionOptions = {
  onProgress?: (progress: ExtractionProgress) => void;
  signal?: AbortSignal;
};

/** An error with a message that can be shown to the user. */
export class TextExtractionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TextExtractionError";
  }
}

/** Value for the `accept` attribute of a file input. */
export const supportedFileTypes = ".txt,.pdf,.png,.jpg,.jpeg,.webp,.bmp";

const extensions: Record<string, FileKind> = {
  txt: "text",
  pdf: "pdf",
  png: "image",
  jpg: "image",
  jpeg: "image",
  webp: "image",
  bmp: "image",
};

const mimeTypes: Record<string, FileKind> = {
  "text/plain": "text",
  "application/pdf": "pdf",
  "image/png": "image",
  "image/jpeg": "image",
  "image/webp": "image",
  "image/bmp": "image",
};

/** Scanned pages are rendered at this resolution before recognition. */
const OCR_DPI = 300;
/** pdf.js uses 72 units per inch at scale 1. */
const PDF_DPI = 72;
/** Keeps the canvas within the limits of mobile browsers. */
const MAX_CANVAS_SIDE = 3600;

export function getFileKind(file: {
  name: string;
  type: string;
}): FileKind | undefined {
  const byMimeType = mimeTypes[file.type.toLowerCase()];
  if (byMimeType !== undefined) return byMimeType;

  //some systems do not report a mime type
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  return file.type === "" ? extensions[extension] : undefined;
}

function absoluteUrl(url: string): string {
  //workers resolve relative urls against their own location
  return new URL(url, window.location.origin).href;
}

/** Reject as soon as the signal is aborted, even if the promise never settles. */
async function abortable<T>(
  promise: Promise<T>,
  signal: AbortSignal | undefined,
): Promise<T> {
  if (signal === undefined) return promise;
  signal.throwIfAborted();

  return new Promise<T>((resolve, reject) => {
    const onAbort = (): void => {
      reject(signal.reason as Error);
    };
    signal.addEventListener("abort", onAbort, { once: true });
    promise
      .then(resolve, reject)
      .finally(() => signal.removeEventListener("abort", onAbort));
  });
}

type Ocr = {
  recognize: (
    image: Blob | HTMLCanvasElement,
    onProgress: (progress: number) => void,
  ) => Promise<string>;
  terminate: () => Promise<void>;
};

/** The recognition engine is only downloaded and started on first use. */
function createOcr(): Ocr {
  let onProgress: ((progress: number) => void) | undefined;

  const start = async (): Promise<Tesseract.Worker> => {
    const { default: Tesseract } = await import("tesseract.js");
    return Tesseract.createWorker("eng", Tesseract.OEM.LSTM_ONLY, {
      workerPath: absoluteUrl(vendorAssets.ocrWorkerPath),
      corePath: absoluteUrl(vendorAssets.ocrCorePath),
      langPath: absoluteUrl(vendorAssets.ocrLangPath),
      //the worker is served from our origin, no need to wrap it in a blob
      workerBlobURL: false,
      logger: (message) => {
        if (message.status === "recognizing text") {
          onProgress?.(message.progress);
        }
      },
    });
  };

  let worker: Promise<Tesseract.Worker> | undefined;

  return {
    recognize: async (image, progressCallback) => {
      worker ??= start();
      const instance = await worker;
      onProgress = progressCallback;
      const result = await instance.recognize(image);
      return result.data.text;
    },
    terminate: async () => {
      if (worker === undefined) return;
      const starting = worker;
      worker = undefined;
      try {
        await (await starting).terminate();
      } catch {
        //the worker failed to start, nothing to clean up
      }
    },
  };
}

async function renderPage(page: PDFPageProxy): Promise<HTMLCanvasElement> {
  const size = page.getViewport({ scale: 1 });
  const scale = Math.min(
    OCR_DPI / PDF_DPI,
    MAX_CANVAS_SIDE / Math.max(size.width, size.height),
  );
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const canvasContext = canvas.getContext("2d");
  if (canvasContext === null) {
    throw new Error("Could not create a canvas to render the page");
  }
  await page.render({ canvasContext, viewport }).promise;

  return canvas;
}

async function extractTextFromPdf(
  file: File,
  ocr: Ocr,
  { onProgress, signal }: ExtractionOptions,
): Promise<string> {
  const pdfjs = await abortable(
    import("pdfjs-dist/legacy/build/pdf.mjs"),
    signal,
  );
  pdfjs.GlobalWorkerOptions.workerSrc = absoluteUrl(vendorAssets.pdfWorkerSrc);

  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
    cMapUrl: absoluteUrl(vendorAssets.pdfCMapUrl),
    cMapPacked: true,
    standardFontDataUrl: absoluteUrl(vendorAssets.pdfStandardFontDataUrl),
  });

  try {
    const pdf = await abortable(loadingTask.promise, signal);
    /** a page is either the lines of its text layer or recognized paragraphs */
    const pages: (PageLines | string[])[] = [];

    for (let number = 1; number <= pdf.numPages; number++) {
      signal?.throwIfAborted();
      onProgress?.({ stage: "reading", page: number, pages: pdf.numPages });

      const page = await abortable(pdf.getPage(number), signal);
      const content = await abortable(page.getTextContent(), signal);
      const lines = textItemsToLines(
        content.items.filter(
          (item): item is typeof item & TextItemLike => "str" in item,
        ),
      );

      if (lines.length > 0) {
        const [, bottom = 0, , top = 0] = page.view;
        pages.push({ lines, bottom, top });
      } else {
        //no text layer, most likely a scan
        const canvas = await abortable(renderPage(page), signal);
        const text = await abortable(
          ocr.recognize(canvas, (progress) => {
            onProgress?.({
              stage: "recognizing",
              page: number,
              pages: pdf.numPages,
              progress,
            });
          }),
          signal,
        );
        pages.push(splitPlainTextIntoParagraphs(text));

        //release the bitmap right away, pages are large
        canvas.width = 0;
        canvas.height = 0;
      }

      page.cleanup();
    }

    const textLayers = removeMarginalText(
      pages.filter((page): page is PageLines => !Array.isArray(page)),
    );
    const paragraphs = pages.flatMap((page) =>
      removePageNumbers(
        Array.isArray(page)
          ? page
          : groupLinesIntoParagraphs(textLayers.shift() ?? []),
      ),
    );

    return paragraphsToText(mergeBrokenParagraphs(paragraphs));
  } catch (e) {
    if (e instanceof Error && e.name === "PasswordException") {
      throw new TextExtractionError(
        "Password protected PDFs are not supported",
      );
    }
    if (e instanceof Error && e.name === "InvalidPDFException") {
      throw new TextExtractionError("File is not a valid PDF");
    }
    throw e;
  } finally {
    void loadingTask.destroy();
  }
}

async function extractTextFromImage(
  file: File,
  ocr: Ocr,
  { onProgress, signal }: ExtractionOptions,
): Promise<string> {
  const text = await abortable(
    ocr.recognize(file, (progress) => {
      onProgress?.({ stage: "recognizing", page: 1, pages: 1, progress });
    }),
    signal,
  );
  return paragraphsToText(
    mergeBrokenParagraphs(splitPlainTextIntoParagraphs(text)),
  );
}

/**
 * Extract the text of a file without sending it anywhere.
 * @throws TextExtractionError if the file cannot be used
 * @throws the reason of the signal if the extraction is aborted
 */
export async function extractTextFromFile(
  file: File,
  options: ExtractionOptions = {},
): Promise<string> {
  const kind = getFileKind(file);

  if (kind === undefined) {
    throw new TextExtractionError("File type is not supported");
  }
  if (kind === "text") {
    return file.text();
  }

  options.onProgress?.({ stage: "loading" });
  const ocr = createOcr();
  try {
    return kind === "pdf"
      ? await extractTextFromPdf(file, ocr, options)
      : await extractTextFromImage(file, ocr, options);
  } finally {
    void ocr.terminate();
  }
}
