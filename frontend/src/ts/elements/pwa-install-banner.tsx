import { JSXElement } from "solid-js";
import { z } from "zod";

import { Button } from "../components/common/Button";
import { Fa } from "../components/common/Fa";
import { addBanner, removeBanner } from "../states/banners";
import { LocalStorageWithSchema } from "../utils/local-storage-with-schema";
import { isIos, isSafari } from "../utils/misc";

/**
 * Extends the standard Event interface for the beforeinstallprompt event.
 * Supported by Chromium-based browsers.
 */
type BeforeInstallPromptEvent = Event & {
  prompt(): Promise<{ outcome: "accepted" | "dismissed" }>;
};

declare global {
  // oxlint-disable-next-line typescript/consistent-type-definitions -- interface merging
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
    appinstalled: Event;
  }
}

const dismissed = new LocalStorageWithSchema({
  key: "pwaInstallBannerDismissed",
  schema: z.boolean(),
  fallback: false,
});

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let bannerId: number | null = null;
let canShow = false;

function isRunningStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((navigator as { standalone?: boolean }).standalone)
  );
}

function showBanner(customContent: JSXElement): void {
  if (bannerId !== null) return;

  bannerId = addBanner({
    level: "notice",
    icon: "fas fa-fw fa-download",
    customContent,
    onClose: () => {
      dismissed.set(true);
      bannerId = null;
    },
  });
}

function removeBannerIfShown(): void {
  if (bannerId !== null) {
    const id = bannerId;
    bannerId = null;
    // removeBanner triggers the banner's onClose callback, which persists dismissed=true
    removeBanner(id);
  }
}

async function handleInstallClick(): Promise<void> {
  if (deferredPrompt === null) return;

  const promptEvent = deferredPrompt;
  deferredPrompt = null;
  // Always remove the banner when prompt is triggered, since deferredPrompt
  // cannot be re-used whether accepted or dismissed
  removeBannerIfShown();

  await promptEvent.prompt();
}

function showInstallBanner(): void {
  showBanner(
    <>
      Install Monkeytype as an app for a better experience.{" "}
      <Button
        variant="button"
        class="ml-2 px-2 py-0.5"
        onClick={() => void handleInstallClick()}
      >
        Install
      </Button>
    </>,
  );
}

function showIosSafariInstructions(): void {
  showBanner(
    <>
      Install Monkeytype: tap <Fa icon="fa-share-square" /> Share, then{" "}
      <Fa icon="fa-plus-square" /> Add to Home Screen.
    </>,
  );
}

/**
 * Registers event listeners early during startup, before awaiting config or auth.
 * This ensures beforeinstallprompt is never missed if it fires early.
 */
export function init(): void {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event;
    if (canShow) {
      showInstallBanner();
    }
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    removeBannerIfShown();
  });
}

/**
 * Evaluates whether to show the install banner after app initialization completes.
 */
export function showIfNotClosedBefore(): void {
  if (isRunningStandalone() || dismissed.get()) return;

  canShow = true;

  if (deferredPrompt !== null) {
    showInstallBanner();
  } else if (isIos() && isSafari()) {
    showIosSafariInstructions();
  }
}
