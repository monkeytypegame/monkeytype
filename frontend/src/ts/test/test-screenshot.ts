import { showLoaderBar, hideLoaderBar } from "../signals/loader-bar";
import * as Replay from "./replay";
import * as Misc from "../utils/misc";
import { isAuthenticated } from "../firebase";
import { getActiveFunboxesWithFunction } from "./funbox/list";
import * as DB from "../db";
import { format } from "date-fns/format";
import { getActivePage, setIsScreenshotting } from "../signals/core";
import { getHtmlByUserFlags } from "../controllers/user-flag-controller";
import * as Notifications from "../elements/notifications";
import { convertRemToPixels } from "../utils/numbers";
import * as TestState from "./test-state";
import { qs, qsa } from "../utils/dom";
import { getTheme } from "../signals/theme";

let revealReplay = false;
let revertCookie = false;

function revert(): void {
  setIsScreenshotting(false);
  hideLoaderBar();
  qs("#ad-result-wrapper")?.show();
  qs("#ad-result-small-wrapper")?.show();
  qs("#testConfig")?.show();
  qs(".pageTest .screenshotSpacer")?.remove();
  qs("#notificationCenter")?.show();
  qs(".pageTest .ssWatermark")?.hide();
  qs(".pageTest .ssWatermark")?.setText("monkeytype.com"); // Reset watermark text
  qs(".pageTest .buttons")?.show();
  qs("noscript")?.show();
  qs("#nocss")?.show();
  qs("header")?.removeClass("invisible");
  qs("#result")?.removeClass("noBalloons");
  qs(".wordInputHighlight")?.show();
  qsa(".highlightContainer")?.show();
  if (revertCookie) qs("#cookiesModal")?.show();
  if (revealReplay) qs("#resultReplay")?.show();
  if (!isAuthenticated()) {
    qs(".pageTest .loginTip")?.removeClass("hidden");
  }
  qs("html")?.setStyle({ scrollBehavior: "smooth" });
  for (const fb of getActiveFunboxesWithFunction("applyGlobalCSS")) {
    fb.functions.applyGlobalCSS();
  }
}

let firefoxClipboardNotificationShown = false;

/**
 * Prepares UI, generates screenshot canvas using modern-screenshot, and reverts UI changes.
 * Returns the generated canvas element or null on failure.
 * Handles its own loader and basic error notifications for canvas generation.
 */
async function generateCanvas(): Promise<HTMLCanvasElement | null> {
  const { domToCanvas } = await import("modern-screenshot");
  showLoaderBar(true);

  if (!qs("#resultReplay")?.hasClass("hidden")) {
    revealReplay = true;
    Replay.pauseReplay();
  }
  if (
    Misc.isElementVisible("#cookiesModal") ||
    document.contains(document.querySelector("#cookiesModal"))
  ) {
    revertCookie = true;
  }

  // --- UI Preparation ---
  const dateNow = new Date(Date.now());
  qs("#resultReplay")?.hide();
  qs(".pageTest .ssWatermark")?.show();

  const snapshot = DB.getSnapshot();
  const ssWatermark = [format(dateNow, "dd MMM yyyy HH:mm"), "monkeytype.com"];
  if (snapshot?.name !== undefined) {
    const userText = `${snapshot?.name}${getHtmlByUserFlags(snapshot, {
      iconsOnly: true,
    })}`;
    ssWatermark.unshift(userText);
  }
  qs(".pageTest .ssWatermark")?.setHtml(
    ssWatermark
      .map((el) => `<span>${el}</span>`)
      .join("<span class='pipe'>|</span>"),
  );

  setIsScreenshotting(true);
  qs(".pageTest .buttons")?.hide();
  qs("#notificationCenter")?.hide();
  qs(".pageTest .loginTip")?.hide();
  qs("noscript")?.hide();
  qs("#nocss")?.hide();
  qs("#ad-result-wrapper")?.hide();
  qs("#ad-result-small-wrapper")?.hide();
  qs("#testConfig")?.hide();
  // Ensure spacer is removed before adding a new one if function is called rapidly
  qs(".pageTest .screenshotSpacer")?.remove();
  qs(".page.pageTest")?.prependHtml("<div class='screenshotSpacer'></div>");
  qs("header")?.addClass("invisible");
  qs("#result")?.addClass("noBalloons");
  qs(".wordInputHighlight")?.hide();
  qsa(".highlightContainer")?.hide();
  if (revertCookie) qs("#cookiesModal")?.hide();

  for (const fb of getActiveFunboxesWithFunction("clearGlobal")) {
    fb.functions.clearGlobal();
  }

  (document.querySelector("html") as HTMLElement).style.scrollBehavior = "auto";
  window.scrollTo({ top: 0, behavior: "auto" });

  // --- Build embedded font CSS ---
  let embeddedFontCss = "";
  try {
    embeddedFontCss = await buildEmbeddedFontCss();
  } catch (e) {
    console.warn("Failed to embed fonts:", e);
  }

  // --- Target Element Calculation ---
  const src = qs("#result .wrapper");
  if (src === null) {
    console.error("Result wrapper not found for screenshot");
    Notifications.add("Screenshot target element not found", -1);
    revert();
    return null;
  }
  // Wait a frame to ensure all UI changes are rendered
  await new Promise((resolve) => requestAnimationFrame(resolve));

  const sourceX = src.screenBounds().left ?? 0;
  const sourceY = src.screenBounds().top ?? 0;

  const sourceWidth = src.getOuterWidth();
  const sourceHeight = src.getOuterHeight();
  const paddingX = convertRemToPixels(2);
  const paddingY = convertRemToPixels(2);

  try {
    // Compute full-document render size to keep the target area in frame on small viewports
    const root = document.documentElement;
    const { scrollWidth, clientWidth, scrollHeight, clientHeight } = root;
    const targetWidth = Math.max(scrollWidth, clientWidth);
    const targetHeight = Math.max(scrollHeight, clientHeight);

    // Target the HTML root to include .customBackground
    const fullCanvas = await domToCanvas(root, {
      backgroundColor: getTheme().bg,
      // Sharp output
      scale: window.devicePixelRatio ?? 1,

      // Pass embedded font CSS with data URLs
      font: embeddedFontCss ? { cssText: embeddedFontCss } : undefined,

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
      Notifications.add("Failed to get canvas context for screenshot", -1);
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
    Notifications.add(
      Misc.createErrorMessage(e, "Error creating screenshot canvas"),
      -1,
    );
    return null;
  } finally {
    revert(); // Ensure UI is reverted on both success and error
  }
}

/**
 * Generates screenshot and attempts to copy it to the clipboard.
 * Falls back to opening in a new tab if clipboard access fails.
 * Handles notifications related to the copy action.
 * (This function should be used by the 'copy' command or the original button)
 */
export async function copyToClipboard(): Promise<void> {
  const canvas = await generateCanvas();
  if (!canvas) {
    // Error notification handled by generateScreenshotCanvas
    return;
  }

  canvas.toBlob(async (blob) => {
    if (!blob) {
      Notifications.add("Failed to generate image data (blob is null)", -1);
      return;
    }
    try {
      // Attempt to copy using ClipboardItem API
      const clipItem = new ClipboardItem(
        Object.defineProperty({}, blob.type, {
          value: blob,
          enumerable: true,
        }),
      );
      await navigator.clipboard.write([clipItem]);
      Notifications.add("Copied screenshot to clipboard", 1, { duration: 2 });
    } catch (e) {
      // Handle clipboard write error
      console.error("Error saving image to clipboard", e);

      // Firefox specific message (only show once)
      if (
        navigator.userAgent.toLowerCase().includes("firefox") &&
        !firefoxClipboardNotificationShown
      ) {
        firefoxClipboardNotificationShown = true;
        Notifications.add(
          "On Firefox you can enable the asyncClipboard.clipboardItem permission in about:config to enable copying straight to the clipboard",
          0,
          { duration: 10 },
        );
      }

      // General fallback notification and action
      Notifications.add(
        "Could not copy screenshot to clipboard. Opening in new tab instead (make sure popups are allowed)",
        0,
        { duration: 5 },
      );
      try {
        // Fallback: Open blob in a new tab
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl);
        // No need to revoke URL immediately as the new tab needs it.
        // Browser usually handles cleanup when tab is closed or navigated away.
      } catch (openError) {
        Notifications.add("Failed to open screenshot in new tab", -1);
        console.error("Error opening blob URL:", openError);
      }
    }
  });
}

/**
 * Generates screenshot canvas and returns the image data as a Blob.
 * Handles notifications for canvas/blob generation errors.
 * (This function is intended to be used by the 'download' command)
 */
async function getBlob(): Promise<Blob | null> {
  const canvas = await generateCanvas();
  if (!canvas) {
    // Notification already handled by generateScreenshotCanvas
    return null;
  }

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        Notifications.add("Failed to convert canvas to Blob for download", -1);
        resolve(null);
      } else {
        resolve(blob); // Return the generated blob
      }
    }, "image/png"); // Explicitly request PNG format
  });
}

export async function download(): Promise<void> {
  try {
    const blob = await getBlob();

    if (!blob) {
      Notifications.add("Failed to generate screenshot data", -1);
      return;
    }

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    link.download = `monkeytype-result-${timestamp}.png`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    Notifications.add("Screenshot download started", 1);
  } catch (error) {
    console.error("Error downloading screenshot:", error);
    Notifications.add("Failed to download screenshot", -1);
  }
}

qs(".pageTest")?.onChild("click", "#saveScreenshotButton", (event) => {
  if (event.shiftKey) {
    void download();
  } else {
    void copyToClipboard();
  }

  // reset save screenshot button icon
  qs("#saveScreenshotButton i")
    ?.removeClass(["fas", "fa-download"])
    ?.addClass(["far", "fa-image"]);
});

document.addEventListener("keydown", (event) => {
  if (!(TestState.resultVisible && getActivePage() === "test")) return;
  if (event.key !== "Shift") return;
  qs("#result #saveScreenshotButton i")
    ?.removeClass(["far", "fa-image"])
    ?.addClass(["fas", "fa-download"]);
});

document.addEventListener("keyup", (event) => {
  if (!(TestState.resultVisible && getActivePage() === "test")) return;
  if (event.key !== "Shift") return;
  qs("#result #saveScreenshotButton i")
    ?.removeClass(["fas", "fa-download"])
    ?.addClass(["far", "fa-image"]);
});

//below is all ai magic

/**
 * Recursively extracts all @font-face rules from stylesheets, including those inside @layer
 */
function extractAllFontFaceRules(): CSSFontFaceRule[] {
  const fontRules: CSSFontFaceRule[] = [];

  function traverseRules(rules: CSSRuleList): void {
    for (const rule of rules) {
      if (rule instanceof CSSFontFaceRule) {
        fontRules.push(rule);
      } else if (
        "cssRules" in rule &&
        typeof rule.cssRules === "object" &&
        rule.cssRules !== null
      ) {
        traverseRules(rule.cssRules as CSSRuleList);
      }
    }
  }

  for (const sheet of document.styleSheets) {
    try {
      if (sheet?.cssRules?.length && sheet.cssRules.length > 0) {
        traverseRules(sheet.cssRules);
      }
    } catch (e) {
      console.warn("Cannot access stylesheet:", e);
    }
  }

  return fontRules;
}

/**
 * Fetches a font file and converts it to a data URL
 */
async function fontUrlToDataUrl(url: string): Promise<string | null> {
  try {
    const absoluteUrl = new URL(url, window.location.href).href;
    const response = await fetch(absoluteUrl, {
      mode: "cors",
      credentials: "omit",
    });
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/**
 * Converts a @font-face rule to CSS text with embedded data URLs
 */
async function fontFaceRuleToEmbeddedCss(
  rule: CSSFontFaceRule,
): Promise<string | null> {
  let cssText = rule.cssText;
  const srcProperty = rule.style.getPropertyValue("src");

  if (!srcProperty) return null;

  // Extract all url() references
  const urlRegex = /url\(['"]?([^'"]+?)['"]?\)/g;
  const matches = [...srcProperty.matchAll(urlRegex)];

  if (matches.length === 0) return cssText;

  for (const match of matches) {
    const originalUrl = match[1];
    if (
      typeof originalUrl !== "string" ||
      originalUrl === "" ||
      originalUrl.startsWith("data:")
    ) {
      continue;
    }
    const dataUrl = await fontUrlToDataUrl(originalUrl);
    if (typeof dataUrl === "string" && dataUrl !== "") {
      const urlPattern = new RegExp(
        `url\\(['"]?${originalUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}['"]?\\)`,
        "g",
      );
      cssText = cssText.replace(urlPattern, `url(${dataUrl})`);
    }
  }

  return cssText;
}

/**
 * Collects all used font families in the document
 */
function getUsedFontFamilies(): Set<string> {
  const families = new Set<string>();

  // Walk through all elements
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_ELEMENT,
    null,
  );

  let node: Node | null;
  while ((node = walker.nextNode())) {
    if (node instanceof HTMLElement) {
      const fontFamily = getComputedStyle(node).fontFamily;
      if (fontFamily) {
        fontFamily.split(",").forEach((family) => {
          families.add(family.trim().replace(/['"]/g, "").toLowerCase());
        });
      }
    }
  }

  return families;
}

/**
 * Builds font CSS with data URLs embedded, including fonts from @layer
 */
async function buildEmbeddedFontCss(): Promise<string> {
  const allFontRules = extractAllFontFaceRules();
  const usedFamilies = getUsedFontFamilies();
  const embeddedRules: string[] = [];

  for (const rule of allFontRules) {
    const fontFamily = rule.style.getPropertyValue("font-family");
    if (!fontFamily) continue;
    const normalizedFamily = fontFamily
      .trim()
      .replace(/['"]/g, "")
      .toLowerCase();
    if (!usedFamilies.has(normalizedFamily)) continue;
    const embeddedCss = await fontFaceRuleToEmbeddedCss(rule);
    if (embeddedCss !== null) embeddedRules.push(embeddedCss);
  }

  return embeddedRules.join("\n");
}
