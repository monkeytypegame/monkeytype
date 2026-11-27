import { onCleanup } from "solid-js";

import { setIsScreenshotting } from "../states/core";
import { hideLoaderBar, showLoaderBar } from "../states/loader-bar";
import {
  showErrorNotification,
  showSuccessNotification,
} from "../states/notifications";
import * as Replay from "../components/pages/test/result/replay";
import { download as downloadFile } from "../utils/misc";
import { convertRemToPixels } from "../utils/numbers";
import {
  canvasToBlob,
  captureElement,
  copyImageToClipboard,
} from "../utils/screenshot";

// the result element to capture
let target: HTMLElement | undefined;

/** TestResult's ref: captures read `el` until its owner cleans up. */
export function registerScreenshotTarget(el: HTMLElement): void {
  target = el;
  onCleanup(() => {
    if (target === el) target = undefined;
  });
}

function prepare(): void {
  showLoaderBar(true);

  if (Replay.replayState.open) {
    Replay.pauseReplay();
  }

  // elements hide through this signal: the result components, word highlight,
  // header, footer, overlays, crt and the static no-CSS box (NoCssDetails)
  setIsScreenshotting(true);
}

function revert(): void {
  setIsScreenshotting(false);
  hideLoaderBar();
  document.documentElement.style.scrollBehavior = "smooth";
}

async function captureResult(): Promise<Blob | null> {
  prepare();
  try {
    const src = target;
    if (src === undefined) {
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
