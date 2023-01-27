import Config from "./config";
import * as Caret from "./test/caret";
import * as Notifications from "./elements/notifications";
import * as CustomText from "./test/custom-text";
import * as TestActive from "./states/test-active";
import * as ConfigEvent from "./observables/config-event";
import { debounce, throttle } from "throttle-debounce";
import * as TestUI from "./test/test-ui";
import { get as getActivePage } from "./states/active-page";

export function updateKeytips(): void {
  const modifierKey = window.navigator.userAgent.toLowerCase().includes("mac")
    ? "cmd"
    : "ctrl";

  if (Config.quickRestart === "esc") {
    $(".pageSettings .tip").html(`
    tip: You can also change all these settings quickly using the
    command line (<key>${modifierKey}</key>+<key>shift</key>+<key>p</key>)`);
  } else {
    $(".pageSettings .tip").html(`
    tip: You can also change all these settings quickly using the
    command line (<key>esc</key> or <key>${modifierKey}</key>+<key>shift</key>+<key>p</key>)`);
  }

  if (Config.quickRestart === "esc") {
    $("#bottom .keyTips").html(`
    <key>esc</key> - restart test<br>
    <key>tab</key> or <key>${modifierKey}</key>+<key>shift</key>+<key>p</key> - command line`);
  } else if (Config.quickRestart === "tab") {
    $("#bottom .keyTips").html(`
    <key>tab</key> - restart test<br>
      <key>esc</key> or <key>${modifierKey}</key>+<key>shift</key>+<key>p</key> - command line`);
  } else {
    $("#bottom .keyTips").html(`
    <key>tab</key> + <key>enter</key> - restart test<br>
    <key>esc</key> or <key>${modifierKey}</key>+<key>shift</key>+<key>p</key> - command line`);
  }
}

if (window.location.hostname === "localhost") {
  window.onerror = function (error): void {
    Notifications.add(error.toString(), -1);
  };
  $("#top .logo .top").text("localhost");
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
    (Config.mode === "words" && Config.words < 1000) ||
    (Config.mode === "time" && Config.time < 3600) ||
    Config.mode === "quote" ||
    (Config.mode === "custom" &&
      CustomText.isWordRandom &&
      CustomText.word < 1000) ||
    (Config.mode === "custom" &&
      CustomText.isTimeRandom &&
      CustomText.time < 1000) ||
    (Config.mode === "custom" &&
      !CustomText.isWordRandom &&
      CustomText.text.length < 1000)
  ) {
    //ignore
  } else {
    if (TestActive.get()) {
      event.preventDefault();
      // Chrome requires returnValue to be set.
      event.returnValue = "";
    }
  }
});

const debouncedEvent = debounce(250, async () => {
  Caret.updatePosition();
  if (getActivePage() === "test" && !TestUI.resultVisible) {
    if (Config.tapeMode !== "off") {
      TestUI.scrollTape();
    } else {
      const word =
        document.querySelectorAll<HTMLElement>("#words .word")[
          TestUI.currentWordElementIndex - 1
        ];
      if (!word) return;
      const currentTop: number = Math.floor(word.offsetTop);
      TestUI.lineJump(currentTop);
    }
  }
  setTimeout(() => {
    Caret.show();
  }, 250);
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
