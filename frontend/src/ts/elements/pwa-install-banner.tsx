import { z } from "zod";

import { addBanner, removeBanner } from "../states/banners";
import { LocalStorageWithSchema } from "../utils/local-storage-with-schema";

/**
 * Extends the standard BeforeInstallPromptEvent interface.
 * This event is not part of any spec but is supported by Chromium-based browsers.
 */
type BeforeInstallPromptEvent = Event & {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
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

function isRunningStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((navigator as { standalone?: boolean }).standalone)
  );
}

function isIos(): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.userAgent.includes("Mac") && "ontouchend" in document)
  );
}

function isSafari(): boolean {
  const ua = navigator.userAgent;
  return ua.includes("Safari") && !/Chrome|CriOS|FxiOS|EdgiOS/.test(ua);
}

async function handleInstallClick(): Promise<void> {
  if (deferredPrompt === null) return;

  const { outcome } = await deferredPrompt.prompt();

  if (outcome === "accepted") {
    removeBannerIfShown();
  }

  deferredPrompt = null;
}

function removeBannerIfShown(): void {
  if (bannerId !== null) {
    removeBanner(bannerId);
    bannerId = null;
  }
}

function showInstallBanner(): void {
  if (bannerId !== null) return;

  bannerId = addBanner({
    level: "notice",
    icon: "fas fa-fw fa-download",
    customContent: (
      <>
        Install Monkeytype as an app for a better experience.{" "}
        <button
          type="button"
          class="rounded-sm bg-bg px-2 py-0.5 text-text hover:bg-main hover:text-bg"
          onClick={() => void handleInstallClick()}
        >
          Install
        </button>
      </>
    ),
    onClose: () => {
      dismissed.set(true);
      bannerId = null;
    },
  });
}

function showIosSafariInstructions(): void {
  if (bannerId !== null) return;

  bannerId = addBanner({
    level: "notice",
    icon: "fas fa-fw fa-download",
    customContent: (
      <>
        Install Monkeytype: tap <i class="fas fa-share-square"></i> Share, then{" "}
        <i class="fas fa-plus-square"></i> Add to Home Screen.
      </>
    ),
    onClose: () => {
      dismissed.set(true);
      bannerId = null;
    },
  });
}

export function init(): void {
  // Don't show anything if already running as a standalone app
  if (isRunningStandalone()) return;

  // Don't show if the user has already dismissed the banner
  if (dismissed.get()) return;

  // Listen for the browser's install prompt (Chromium-based browsers)
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event;
    showInstallBanner();
  });

  // Hide the banner once the app is installed
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    removeBannerIfShown();
  });

  // For iOS Safari (which doesn't fire beforeinstallprompt),
  // show manual "Add to Home Screen" instructions
  if (isIos() && isSafari()) {
    showIosSafariInstructions();
  }
}
