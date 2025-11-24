import Config from "./config";
import * as Caret from "./test/caret";
import * as CustomText from "./test/custom-text";
import * as TestState from "./test/test-state";
import * as ConfigEvent from "./observables/config-event";
import { debounce, throttle } from "throttle-debounce";
import * as TestUI from "./test/test-ui";
import { get as getActivePage } from "./states/active-page";
import { isDevEnvironment } from "./utils/misc";
import { isCustomTextLong } from "./states/custom-text-name";
import { canQuickRestart } from "./utils/quick-restart";
import { FontName } from "@monkeytype/schemas/fonts";
import { applyFontFamily } from "./controllers/theme-controller";
import { qs } from "./utils/dom";

let isPreviewingFont = false;
export function previewFontFamily(font: FontName): void {
  document.documentElement.style.setProperty(
    "--font",
    '"' + font.replaceAll(/_/g, " ") + '", "Roboto Mono", "Vazirmatn"'
  );
  void TestUI.updateHintsPositionDebounced();
  isPreviewingFont = true;
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

function updateKeytips(): void {
  const userAgent = window.navigator.userAgent.toLowerCase();
  const modifierKey =
    userAgent.includes("mac") && !userAgent.includes("firefox")
      ? "cmd"
      : "ctrl";

  const commandKey = Config.quickRestart === "esc" ? "tab" : "esc";
  qs("footer .keyTips")?.html(`
    ${
      Config.quickRestart === "off"
        ? "<key>tab</key> + <key>enter</key>"
        : `<key>${Config.quickRestart}</key>`
    } - restart test<br>
    <key>${commandKey}</key> or <key>${modifierKey}</key>+<key>shift</key>+<key>p</key> - command line`);
}

if (isDevEnvironment()) {
  qs("header #logo .top")?.setText("localhost");
  qs("head title")?.setText(
    (qs("head title")?.textContent ?? "") + " (localhost)"
  );
  qs("body")?.appendHtml(
    `<div class="devIndicator tl">local</div><div class="devIndicator br">local</div>`
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
      isCustomTextLong() ?? false
    )
  ) {
    //ignore
  } else {
    if (TestState.isActive) {
      event.preventDefault();
      // Included for legacy support, e.g. Chrome/Edge < 119
      // eslint-disable-next-line @typescript-eslint/no-deprecated
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

$(window).on("resize", () => {
  throttledEvent();
  debouncedEvent();
});

ConfigEvent.subscribe(async (eventKey) => {
  if (eventKey === "quickRestart") updateKeytips();
  if (eventKey === "showKeyTips") {
    const keyTipsElement = qs("footer .keyTips");
    if (Config.showKeyTips) {
      keyTipsElement?.removeClass("hidden");
    } else {
      keyTipsElement?.addClass("hidden");
    }
  }
  if (eventKey === "fontFamily") {
    await applyFontFamily();
  }
});
