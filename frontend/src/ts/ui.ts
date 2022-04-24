import Config from "./config";
import * as Caret from "./test/caret";
import * as Notifications from "./elements/notifications";
import * as CustomText from "./test/custom-text";
import * as TestActive from "./states/test-active";
import * as ConfigEvent from "./observables/config-event";
import { debounce } from "throttle-debounce";

export function updateKeytips(): void {
  if (Config.swapEscAndTab) {
    $(".pageSettings .tip").html(`
    tip: You can also change all these settings quickly using the
    command line (
    <key>tab</key>
    )`);
    $("#bottom .keyTips").html(`
    <key>esc</key> - restart test<br>
      <key>tab</key> - command line`);
  } else {
    $(".pageSettings .tip").html(`
    tip: You can also change all these settings quickly using the
    command line (
    <key>esc</key>
    )`);
    $("#bottom .keyTips").html(`
    <key>tab</key> - restart test<br>
      <key>esc</key> or <key>ctrl/cmd</key>+<key>shift</key>+<key>p</key> - command line`);
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
  $(".pageSettings .discordIntegration .buttons a").attr(
    "href",
    "https://discord.com/api/oauth2/authorize?client_id=798272335035498557&redirect_uri=http%3A%2F%2Flocalhost%3A5000%2Fverify&response_type=token&scope=identify"
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

const debouncedCaretUpdate = debounce(250, () => {
  Caret.updatePosition();
});

$(window).on("resize", () => {
  debouncedCaretUpdate();
});

ConfigEvent.subscribe((eventKey) => {
  if (eventKey === "swapEscAndTab") updateKeytips();
});
