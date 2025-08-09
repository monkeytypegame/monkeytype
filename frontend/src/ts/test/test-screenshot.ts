import * as Loader from "../elements/loader";
import * as Replay from "./replay";
import * as Misc from "../utils/misc";
import { isAuthenticated } from "../firebase";
import { getActiveFunboxesWithFunction } from "./funbox/list";
import * as DB from "../db";
import * as ThemeColors from "../elements/theme-colors";
import { format } from "date-fns/format";
import * as TestUI from "./test-ui";
import * as ActivePage from "../states/active-page";
import { getHtmlByUserFlags } from "../controllers/user-flag-controller";
import * as Notifications from "../elements/notifications";
import { convertRemToPixels } from "../utils/numbers";

async function gethtml2canvas(): Promise<typeof import("html2canvas").default> {
  return (await import("html2canvas")).default;
}

let revealReplay = false;
let revertCookie = false;

/**
 * If a local custom background image is present with CSS filters applied, html2canvas
 * may omit those filters. To preserve the visual appearance, this function renders
 * the background image with filters into a temporary canvas overlay positioned
 * exactly over the original image, hides the original, and returns a cleanup
 * function to restore the DOM.
 */
function prepareFilteredBackgroundOverlay(): () => void {
  const img = document.querySelector<HTMLImageElement>(".customBackground img");
  if (!img) return () => undefined;

  const src = img.currentSrc || img.src || "";
  // only handle local backgrounds (data URLs) to avoid tainting the canvas
  if (!src.startsWith("data:")) return () => undefined;

  const cs = getComputedStyle(img);
  // no filter? nothing to do
  const filterCss = cs.filter || "none";
  if (!filterCss || filterCss === "none") return () => undefined;

  const rect = img.getBoundingClientRect();
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(rect.width));
  canvas.height = Math.max(1, Math.round(rect.height));

  // position
  const styleKeys = [
    "position",
    "left",
    "top",
    "right",
    "bottom",
    "width",
    "height",
    "zIndex",
    "opacity",
    "pointerEvents",
  ] as const;
  const canvasStyle = canvas.style as CSSStyleDeclaration & {
    [key in (typeof styleKeys)[number]]: string;
  };
  canvasStyle.position = cs.position || "absolute";
  canvasStyle.left = cs.left;
  canvasStyle.top = cs.top;
  canvasStyle.right = cs.right;
  canvasStyle.bottom = cs.bottom;
  canvasStyle.width = cs.width;
  canvasStyle.height = cs.height;
  canvasStyle.zIndex = cs.zIndex;
  canvasStyle.opacity = ""; // use filter's opacity instead
  canvasStyle.pointerEvents = "none"; // ensure it doesn't block UI

  // normalize filter for Canvas2D: convert blur from rem to px if needed
  const rootFontSizePx = parseFloat(
    getComputedStyle(document.documentElement).fontSize || "16"
  );
  const normalizedFilter = filterCss.replace(
    /blur\(([^)]+)\)/,
    (_match, rawVal: string) => {
      const trimmed = rawVal.trim();
      const num = parseFloat(trimmed);
      if (Number.isNaN(num)) return `blur(0px)`;
      if (trimmed.endsWith("rem")) {
        return `blur(${num * rootFontSizePx}px)`;
      }
      if (trimmed.endsWith("px")) {
        return `blur(${trimmed})`;
      }
      return `blur(${num}px)`;
    }
  );

  const ctx = canvas.getContext("2d");
  if (!ctx) return () => undefined;
  ctx.filter = normalizedFilter;

  const naturalW = img.naturalWidth || 0;
  const naturalH = img.naturalHeight || 0;
  const destW = canvas.width;
  const destH = canvas.height;

  // Draw according to object-fit to match CSS rendering as closely as possible
  const objectFit = cs.objectFit || "fill";
  if (naturalW > 0 && naturalH > 0) {
    if (objectFit === "cover") {
      const scale = Math.max(destW / naturalW, destH / naturalH);
      const drawW = naturalW * scale;
      const drawH = naturalH * scale;
      const dx = (destW - drawW) / 2;
      const dy = (destH - drawH) / 2;
      ctx.drawImage(img, dx, dy, drawW, drawH);
    } else if (objectFit === "contain") {
      const scale = Math.min(destW / naturalW, destH / naturalH);
      const drawW = naturalW * scale;
      const drawH = naturalH * scale;
      const dx = (destW - drawW) / 2;
      const dy = (destH - drawH) / 2;
      ctx.drawImage(img, dx, dy, drawW, drawH);
    } else {
      // fill or default: stretch to element size
      ctx.drawImage(img, 0, 0, destW, destH);
    }
  }

  // insert overlay
  img.after(canvas);
  const prevDisplay = img.style.display;
  img.style.display = "none";

  return () => {
    // cleanup overlay
    try {
      img.style.display = prevDisplay;
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    } catch {}
  };
}

function revert(): void {
  Loader.hide();
  $("#ad-result-wrapper").removeClass("hidden");
  $("#ad-result-small-wrapper").removeClass("hidden");
  $("#testConfig").removeClass("hidden");
  $(".pageTest .screenshotSpacer").remove();
  $("#notificationCenter").removeClass("hidden");
  $("#commandLineMobileButton").removeClass("hidden");
  $(".pageTest .ssWatermark").addClass("hidden");
  $(".pageTest .ssWatermark").text("monkeytype.com"); // Reset watermark text
  $(".pageTest .buttons").removeClass("hidden");
  $("noscript").removeClass("hidden");
  $("#nocss").removeClass("hidden");
  $("header, footer").removeClass("invisible");
  $("#result").removeClass("noBalloons");
  $(".wordInputHighlight").removeClass("hidden");
  $(".highlightContainer").removeClass("hidden");
  if (revertCookie) $("#cookiesModal").removeClass("hidden");
  if (revealReplay) $("#resultReplay").removeClass("hidden");
  if (!isAuthenticated()) {
    $(".pageTest .loginTip").removeClass("hidden");
  }
  (document.querySelector("html") as HTMLElement).style.scrollBehavior =
    "smooth";
  for (const fb of getActiveFunboxesWithFunction("applyGlobalCSS")) {
    fb.functions.applyGlobalCSS();
  }
}

let firefoxClipboardNotificatoinShown = false;

/**
 * Prepares UI, generates screenshot canvas using html2canvas, and reverts UI changes.
 * Returns the generated canvas element or null on failure.
 * Handles its own loader and basic error notifications for canvas generation.
 */
async function generateCanvas(): Promise<HTMLCanvasElement | null> {
  Loader.show();

  if (!$("#resultReplay").hasClass("hidden")) {
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
  $("#resultReplay").addClass("hidden");
  $(".pageTest .ssWatermark").removeClass("hidden");

  const snapshot = DB.getSnapshot();
  const ssWatermark = [format(dateNow, "dd MMM yyyy HH:mm"), "monkeytype.com"];
  if (snapshot?.name !== undefined) {
    const userText = `${snapshot?.name}${getHtmlByUserFlags(snapshot, {
      iconsOnly: true,
    })}`;
    ssWatermark.unshift(userText);
  }
  $(".pageTest .ssWatermark").html(
    ssWatermark
      .map((el) => `<span>${el}</span>`)
      .join("<span class='pipe'>|</span>")
  );
  $(".pageTest .buttons").addClass("hidden");
  $("#notificationCenter").addClass("hidden");
  $("#commandLineMobileButton").addClass("hidden");
  $(".pageTest .loginTip").addClass("hidden");
  $("noscript").addClass("hidden");
  $("#nocss").addClass("hidden");
  $("#ad-result-wrapper").addClass("hidden");
  $("#ad-result-small-wrapper").addClass("hidden");
  $("#testConfig").addClass("hidden");
  // Ensure spacer is removed before adding a new one if function is called rapidly
  $(".pageTest .screenshotSpacer").remove();
  $(".page.pageTest").prepend("<div class='screenshotSpacer'></div>");
  $("header, footer").addClass("invisible");
  $("#result").addClass("noBalloons");
  $(".wordInputHighlight").addClass("hidden");
  $(".highlightContainer").addClass("hidden");
  if (revertCookie) $("#cookiesModal").addClass("hidden");

  for (const fb of getActiveFunboxesWithFunction("clearGlobal")) {
    fb.functions.clearGlobal();
  }

  (document.querySelector("html") as HTMLElement).style.scrollBehavior = "auto";
  window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior }); // Use instant scroll

  // --- Target Element Calculation ---
  const src = $("#result .wrapper");
  if (!src.length) {
    console.error("Result wrapper not found for screenshot");
    Notifications.add("Screenshot target element not found", -1);
    revert();
    return null;
  }
  // Ensure offset calculations happen *after* potential layout shifts from UI prep
  await new Promise((resolve) => setTimeout(resolve, 50)); // Small delay for render updates

  const sourceX = src.offset()?.left ?? 0;
  const sourceY = src.offset()?.top ?? 0;
  const sourceWidth = src.outerWidth(true) as number;
  const sourceHeight = src.outerHeight(true) as number;

  // --- Canvas Generation ---
  let cleanupBgOverlay: () => void = () => undefined;
  try {
    const paddingX = convertRemToPixels(2);
    const paddingY = convertRemToPixels(2);

    // prepare background overlay
    cleanupBgOverlay = prepareFilteredBackgroundOverlay();
    const canvas = await (
      await gethtml2canvas()
    )(document.body, {
      backgroundColor: await ThemeColors.get("bg"),
      width: sourceWidth + paddingX * 2,
      height: sourceHeight + paddingY * 2,
      x: sourceX - paddingX,
      y: sourceY - paddingY,
      logging: false, // Suppress html2canvas logs in console
      useCORS: true, // May be needed if user flags/icons are external
    });

    revert(); // Revert UI *after* canvas is successfully generated
    return canvas;
  } catch (e) {
    Notifications.add(
      Misc.createErrorMessage(e, "Error creating screenshot canvas"),
      -1
    );
    revert(); // Ensure UI is reverted on error
    return null;
  } finally {
    // cleanup overlay
    try {
      cleanupBgOverlay();
    } catch {}
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
        })
      );
      await navigator.clipboard.write([clipItem]);
      Notifications.add("Copied screenshot to clipboard", 1, { duration: 2 });
    } catch (e) {
      // Handle clipboard write error
      console.error("Error saving image to clipboard", e);

      // Firefox specific message (only show once)
      if (
        navigator.userAgent.toLowerCase().includes("firefox") &&
        !firefoxClipboardNotificatoinShown
      ) {
        firefoxClipboardNotificatoinShown = true;
        Notifications.add(
          "On Firefox you can enable the asyncClipboard.clipboardItem permission in about:config to enable copying straight to the clipboard",
          0,
          { duration: 10 }
        );
      }

      // General fallback notification and action
      Notifications.add(
        "Could not copy screenshot to clipboard. Opening in new tab instead (make sure popups are allowed)",
        0,
        { duration: 5 }
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

$(".pageTest").on("click", "#saveScreenshotButton", (event) => {
  if (event.shiftKey) {
    void download();
  } else {
    void copyToClipboard();
  }

  // reset save screenshot button icon
  $("#saveScreenshotButton i")
    .removeClass("fas fa-download")
    .addClass("far fa-image");
});

$(document).on("keydown", (event) => {
  if (!(TestUI.resultVisible && ActivePage.get() === "test")) return;
  if (event.key !== "Shift") return;
  $("#typingTest #result #saveScreenshotButton i")
    .removeClass("far fa-image")
    .addClass("fas fa-download");
});

$(document).on("keyup", (event) => {
  if (!(TestUI.resultVisible && ActivePage.get() === "test")) return;
  if (event.key !== "Shift") return;
  $("#typingTest #result #saveScreenshotButton i")
    .removeClass("fas fa-download")
    .addClass("far fa-image");
});
