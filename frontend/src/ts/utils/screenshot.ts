import { getTheme } from "../states/theme";
import {
  showErrorNotification,
  showNoticeNotification,
  showSuccessNotification,
} from "../states/notifications";
import { ElementWithUtils } from "./dom";

let firefoxClipboardNotificationShown = false;

/**
 * Renders the whole document with modern-screenshot and crops it to `src` plus padding.
 * Returns null on failure (error notification already shown).
 */
export async function captureElement(
  src: ElementWithUtils,
  padding: { x: number; y: number },
): Promise<HTMLCanvasElement | null> {
  const { domToCanvas } = await import("modern-screenshot");

  const html = document.documentElement;
  const prevScrollBehavior = html.style.scrollBehavior;
  html.style.scrollBehavior = "auto";
  window.scrollTo({ top: 0, behavior: "auto" });

  // Wait a frame to ensure all UI changes are rendered
  await new Promise((resolve) => requestAnimationFrame(resolve));

  const sourceX = src.screenBounds().left ?? 0;
  const sourceY = src.screenBounds().top ?? 0;

  const sourceWidth = src.getOuterWidth();
  const sourceHeight = src.getOuterHeight();
  const paddingX = padding.x;
  const paddingY = padding.y;

  try {
    // Compute full-document render size to keep the target area in frame on small viewports
    const { scrollWidth, clientWidth, scrollHeight, clientHeight } = html;
    const targetWidth = Math.max(scrollWidth, clientWidth);
    const targetHeight = Math.max(scrollHeight, clientHeight);

    // Target the HTML root to include .customBackground
    const fullCanvas = await domToCanvas(html, {
      backgroundColor: getTheme().bg,
      // Sharp output
      scale: window.devicePixelRatio ?? 1,
      style: {
        width: `${targetWidth}px`,
        height: `${targetHeight}px`,
        overflow: "hidden", // for scrollbar in small viewports
      },
      // Fetch (for custom background URLs)
      fetch: {
        requestInit: { mode: "cors", credentials: "omit" },
        bypassingCache: true,
      },

      // skipping hidden elements (THAT IS SO IMPORTANT!)
      filter: (el: Node): boolean => {
        if (!(el instanceof HTMLElement)) return true;
        // dev only, thousands of nodes, makes capture ~10x slower
        if (el.id === "tanstack_devtools") return false;
        const cs = getComputedStyle(el);
        return !(el.classList.contains("hidden") || cs.display === "none");
      },
      // Normalize the background layer so its negative z-index doesn't get hidden
      onCloneEachNode: (cloned) => {
        if (cloned instanceof HTMLElement) {
          const el = cloned;
          if (el.classList.contains("customBackground")) {
            el.style.zIndex = "0";
            el.style.width = `${targetWidth}px`;
            el.style.height = `${targetHeight}px`;
            // for the inner image scales
            const img = el.querySelector("img");
            if (img) {
              // (<= 720px viewport width) wpm & acc text wrapper!!
              if (window.innerWidth <= 720) {
                img.style.transform = "translateY(20vh)";
                img.style.height = "100%";
              } else {
                img.style.width = "100%"; // safety nothing more
                img.style.height = "100%"; // for image fit full screen even when words history is opened with many lines
              }
            }
          }
        }
      },
    });

    // Scale and create output canvas
    const scale = fullCanvas.width / targetWidth;
    const paddedWidth = sourceWidth + paddingX * 2;
    const paddedHeight = sourceHeight + paddingY * 2;

    const scaledPaddedWCanvas = Math.round(paddedWidth * scale);
    const scaledPaddedHCanvas = Math.round(paddedHeight * scale);
    const scaledPaddedWForCrop = Math.ceil(paddedWidth * scale);
    const scaledPaddedHForCrop = Math.ceil(paddedHeight * scale);

    const canvas = document.createElement("canvas");
    canvas.width = scaledPaddedWCanvas;
    canvas.height = scaledPaddedHCanvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      showErrorNotification("Failed to get canvas context for screenshot");
      return null;
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Calculate crop coordinates with proper clamping
    const cropX = Math.max(0, Math.floor((sourceX - paddingX) * scale));
    const cropY = Math.max(0, Math.floor((sourceY - paddingY) * scale));
    const cropW = Math.min(scaledPaddedWForCrop, fullCanvas.width - cropX);
    const cropH = Math.min(scaledPaddedHForCrop, fullCanvas.height - cropY);

    ctx.drawImage(
      fullCanvas,
      cropX,
      cropY,
      cropW,
      cropH,
      0,
      0,
      canvas.width,
      canvas.height,
    );
    return canvas;
  } catch (e) {
    showErrorNotification("Error creating screenshot canvas", { error: e });
    return null;
  } finally {
    html.style.scrollBehavior = prevScrollBehavior;
  }
}

export async function canvasToBlob(
  canvas: HTMLCanvasElement,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        showErrorNotification("Failed to generate image data (blob is null)");
      }
      resolve(blob);
    }, "image/png");
  });
}

/**
 * Copies an image to the clipboard.
 * Falls back to opening it in a new tab if clipboard access fails.
 */
export async function copyImageToClipboard(blob: Blob): Promise<void> {
  try {
    // Attempt to copy using ClipboardItem API
    // oxlint-disable-next-line compat/compat
    const clipItem = new ClipboardItem(
      Object.defineProperty({}, blob.type, {
        value: blob,
        enumerable: true,
      }),
    );
    await navigator.clipboard.write([clipItem]);
    showSuccessNotification("Copied screenshot to clipboard", {
      durationMs: 2000,
    });
  } catch (e) {
    // Handle clipboard write error
    console.error("Error saving image to clipboard", e);

    // Firefox specific message (only show once)
    if (
      navigator.userAgent.toLowerCase().includes("firefox") &&
      !firefoxClipboardNotificationShown
    ) {
      firefoxClipboardNotificationShown = true;
      showNoticeNotification(
        "On Firefox you can enable the asyncClipboard.clipboardItem permission in about:config to enable copying straight to the clipboard",
        { durationMs: 10000 },
      );
    }

    // General fallback notification and action
    showNoticeNotification(
      "Could not copy screenshot to clipboard. Opening in new tab instead (make sure popups are allowed)",
      { durationMs: 5000 },
    );
    try {
      // Fallback: Open blob in a new tab
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl);
      // No need to revoke URL immediately as the new tab needs it.
      // Browser usually handles cleanup when tab is closed or navigated away.
    } catch (openError) {
      showErrorNotification("Failed to open screenshot in new tab");
      console.error("Error opening blob URL:", openError);
    }
  }
}
