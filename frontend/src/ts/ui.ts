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

let isPreviewingFont = false;
export function previewFontFamily(font: string): void {
  document.documentElement.style.setProperty(
    "--font",
    '"' + font.replace(/_/g, " ") + '", "Roboto Mono", "Vazirmatn"'
  );
  void TestUI.updateHintsPosition();
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
  $("footer .keyTips").html(`
    ${
      Config.quickRestart === "off"
        ? "<key>tab</key> + <key>enter</key>"
        : `<key>${Config.quickRestart}</key>`
    } - restart test<br>
    <key>${commandKey}</key> or <key>${modifierKey}</key>+<key>shift</key>+<key>p</key> - command line`);
}

if (isDevEnvironment()) {
  $("header #logo .top").text("localhost");
  $("head title").text($("head title").text() + " (localhost)");
  $("body").append(
    `<div class="devIndicator tl">local</div><div class="devIndicator br">local</div>`
  );
}

//stop space scrolling
window.addEventListener("keydown", function (e) {
  if (e.code === "Space" && e.target === document.body) {
    e.preventDefault();
  }
});

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
      // Chrome requires returnValue to be set.
      event.returnValue = "";
    }
  }
});

const debouncedEvent = debounce(250, () => {
  void Caret.updatePosition();
  if (getActivePage() === "test" && !TestUI.resultVisible) {
    if (Config.tapeMode !== "off") {
      void TestUI.scrollTape();
    } else {
      void TestUI.centerActiveLine();
    }
    setTimeout(() => {
      void TestUI.updateWordsInputPosition();
      if ($("#wordsInput").is(":focus")) {
        Caret.show();
      }
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

ConfigEvent.subscribe((eventKey) => {
  if (eventKey === "quickRestart") updateKeytips();
});
