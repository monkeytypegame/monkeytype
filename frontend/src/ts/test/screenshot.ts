import { setIsScreenshotting } from "../states/core";
import { hideLoaderBar, showLoaderBar } from "../states/loader-bar";
import {
  showErrorNotification,
  showSuccessNotification,
} from "../states/notifications";
import { getActiveFunboxesWithFunction } from "./funbox/list";
import * as Replay from "../components/pages/test/result/replay";
import { qs, qsa } from "../utils/dom";
import { download as downloadFile } from "../utils/misc";
import { convertRemToPixels } from "../utils/numbers";
import {
  canvasToBlob,
  captureElement,
  copyImageToClipboard,
} from "../utils/screenshot";

function prepare(): void {
  showLoaderBar(true);

  if (Replay.replayState.open) {
    Replay.pauseReplay();
  }

  // the result components hide the buttons, replay, login tip and ads and show the watermark
  setIsScreenshotting(true);
  qs("noscript")?.hide();
  qs("#nocss")?.hide();
  qsa(".highlightContainer")?.hide();

  for (const fb of getActiveFunboxesWithFunction("clearGlobal")) {
    fb.functions.clearGlobal();
  }
}

function revert(): void {
  setIsScreenshotting(false);
  hideLoaderBar();
  qs("noscript")?.show();
  qs("#nocss")?.show();
  qsa(".highlightContainer")?.show();
  qs("html")?.setStyle({ scrollBehavior: "smooth" });
  for (const fb of getActiveFunboxesWithFunction("applyGlobalCSS")) {
    fb.functions.applyGlobalCSS();
  }
}

async function captureResult(): Promise<Blob | null> {
  prepare();
  try {
    const src = qs("#resultScreenshotTarget");
    if (src === null) {
      console.error("Result wrapper not found for screenshot");
      showErrorNotification("Screenshot target element not found");
      return null;
    }
    const padding = convertRemToPixels(2);
    const canvas = await captureElement(src, { x: padding, y: padding });
    if (canvas === null) return null;
    return await canvasToBlob(canvas);
  } finally {
    revert();
  }
}

export async function captureAndCopyToClipboard(): Promise<void> {
  const blob = await captureResult();
  if (blob === null) return;
  await copyImageToClipboard(blob);
}

export async function captureAndDownload(): Promise<void> {
  try {
    const data = await captureResult();
    if (data === null) return;

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `monkeytype-result-${timestamp}.png`;

    downloadFile({ data, filename });

    showSuccessNotification("Screenshot download started");
  } catch (error) {
    console.error("Error downloading screenshot:", error);
    showErrorNotification("Failed to download screenshot");
  }
}
