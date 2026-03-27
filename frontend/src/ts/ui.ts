import { Config } from "./config/store";
import * as Caret from "./test/caret";
import * as CustomText from "./test/custom-text";
import * as TestState from "./test/test-state";
import { configEvent } from "./events/config";
import { debounce, throttle } from "throttle-debounce";
import * as TestUI from "./test/test-ui";
import { getActivePage, getGlobalOffsetTop } from "./states/core";
import { isDevEnvironment } from "./utils/env";
import { isCustomTextLong } from "./legacy-states/custom-text-name";
import { canQuickRestart } from "./utils/quick-restart";
import { FontName } from "@monkeytype/schemas/fonts";
import { qs, qsr } from "./utils/dom";
import { createEffect } from "solid-js";
import fileStorage from "./utils/file-storage";
import { convertRemToPixels } from "./utils/numbers";

let isPreviewingFont = false;
export function previewFontFamily(font: FontName): void {
  document.documentElement.style.setProperty(
    "--font",
    '"' +
      font.replaceAll(/_/g, " ") +
      '", "Roboto Mono", "Vazirharf", "monospace"',
  );
  void TestUI.updateHintsPositionDebounced();
  isPreviewingFont = true;
}

export async function applyFontFamily(): Promise<void> {
  let font = Config.fontFamily.replace(/_/g, " ");

  const localFont = await fileStorage.getFile("LocalFontFamilyFile");
  if (localFont === undefined) {
    //use config font
    qs(".customFont")?.empty();
  } else {
    font = "LOCALCUSTOM";

    qs(".customFont")?.setHtml(`
      @font-face{ 
        font-family: LOCALCUSTOM;
        src: url(${localFont});
        font-weight: 400;
        font-style: normal;
        font-display: block;
      }`);
  }

  document.documentElement.style.setProperty(
    "--font",
    `"${font}", "Roboto Mono", "Vazirharf", monospace`,
  );
}

export function clearFontPreview(): void {
  if (!isPreviewingFont) return;
  previewFontFamily(Config.fontFamily);
  isPreviewingFont = false;
}

export function setMediaQueryDebugLevel(level: number): void {
  const body = document.querySelector("body") as HTMLElement;

  body.classList.remove("mediaQueryDebugLevel1");
  body.classList.remove("mediaQueryDebugLevel2");
  body.classList.remove("mediaQueryDebugLevel3");

  if (level > 0 && level < 4) {
    body.classList.add(`mediaQueryDebugLevel${level}`);
  }
}

if (isDevEnvironment()) {
  qs("head title")?.setText(
    (qs("head title")?.native.textContent ?? "") + " (localhost)",
  );
  qs("body")?.appendHtml(
    `<div class="devIndicator tl">local</div><div class="devIndicator br">local</div>`,
  );
}

window.addEventListener("beforeunload", (event) => {
  // Cancel the event as stated by the standard.
  if (
    canQuickRestart(
      Config.mode,
      Config.words,
      Config.time,
      CustomText.getData(),
      isCustomTextLong() ?? false,
    )
  ) {
    //ignore
  } else {
    if (TestState.isActive) {
      event.preventDefault();
      // Included for legacy support, e.g. Chrome/Edge < 119
      // oxlint-disable-next-line no-deprecated
      event.returnValue = "";
    }
  }
});

const debouncedEvent = debounce(250, () => {
  if (getActivePage() === "test" && !TestState.resultVisible) {
    if (Config.tapeMode !== "off") {
      void TestUI.scrollTape();
    } else {
      void TestUI.centerActiveLine();
      void TestUI.updateHintsPositionDebounced();
    }
    setTimeout(() => {
      TestUI.updateWordsInputPosition();
      TestUI.focusWords();
      Caret.show();
    }, 250);
  }
});

const throttledEvent = throttle(250, () => {
  Caret.hide();
});

window.addEventListener("resize", () => {
  throttledEvent();
  debouncedEvent();
});

createEffect(() => {
  qsr("#app").setStyle({
    paddingTop: getGlobalOffsetTop() + convertRemToPixels(2) + "px",
  });
});

configEvent.subscribe(async ({ key }) => {
  if (key === "fontFamily") {
    await applyFontFamily();
  }
});
