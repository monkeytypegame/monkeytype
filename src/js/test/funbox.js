import * as TestLogic from "./test-logic";
import * as Notifications from "./notifications";
import * as TestUI from "./test-ui";
import * as Misc from "./misc";
import * as ManualRestart from "./manual-restart-tracker";
import Config, * as UpdateConfig from "./config";
import * as Settings from "./settings";

export let active = "none";
let memoryTimer = null;
let memoryInterval = null;

function showMemoryTimer() {
  $("#typingTest #memoryTimer").stop(true, true).animate(
    {
      opacity: 1,
    },
    125
  );
}

function hideMemoryTimer() {
  $("#typingTest #memoryTimer").stop(true, true).animate(
    {
      opacity: 0,
    },
    125
  );
}

export function resetMemoryTimer() {
  memoryInterval = clearInterval(memoryInterval);
  memoryTimer = null;
  hideMemoryTimer();
}

function updateMemoryTimer(sec) {
  $("#typingTest #memoryTimer").text(
    `Timer left to memorise all words: ${sec}s`
  );
}

export function startMemoryTimer() {
  resetMemoryTimer();
  memoryTimer = Math.round(Math.pow(TestLogic.words.length, 1.2));
  updateMemoryTimer(memoryTimer);
  showMemoryTimer();
  memoryInterval = setInterval(() => {
    memoryTimer -= 1;
    memoryTimer == 0 ? hideMemoryTimer() : updateMemoryTimer(memoryTimer);
    if (memoryTimer <= 0) {
      resetMemoryTimer();
      $("#wordsWrapper").addClass("hidden");
    }
  }, 1000);
}

export function reset() {
  active = "none";
  resetMemoryTimer();
}

export function toggleScript(...params) {
  if (active === "tts") {
    var msg = new SpeechSynthesisUtterance();
    msg.text = params[0];
    msg.lang = "en-US";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(msg);
  }
}

export async function activate(funbox, mode) {
  if (TestLogic.active || TestUI.resultVisible) {
    Notifications.add(
      "You can only change the funbox before starting a test.",
      0
    );
    return false;
  }
  if (Misc.getCurrentLanguage().ligatures) {
    if (funbox == "choo_choo" || funbox == "earthquake") {
      Notifications.add(
        "Current language does not support this funbox mode",
        0
      );
      activate("none", null);
      return;
    }
  }
  $("#funBoxTheme").attr("href", ``);
  $("#words").removeClass("nospace");
  // if (funbox === "none") {

  reset();

  $("#wordsWrapper").removeClass("hidden");
  // }

  if (mode === null || mode === undefined) {
    let list = await Misc.getFunboxList();
    mode = list.filter((f) => f.name === funbox)[0].type;
  }

  ManualRestart.set();
  if (mode === "style") {
    if (funbox != undefined) {
      $("#funBoxTheme").attr("href", `funbox/${funbox}.css`);
      active = funbox;
    }

    if (funbox === "simon_says") {
      UpdateConfig.setKeymapMode("next");
      Settings.groups.keymapMode.updateButton();
      TestLogic.restart();
    }

    if (
      funbox === "read_ahead" ||
      funbox === "read_ahead_easy" ||
      funbox === "read_ahead_hard"
    ) {
      UpdateConfig.setHighlightMode("letter", true);
      TestLogic.restart();
    }
  } else if (mode === "script") {
    if (funbox === "tts") {
      $("#funBoxTheme").attr("href", `funbox/simon_says.css`);
      UpdateConfig.setKeymapMode("off");
      Settings.groups.keymapMode.updateButton();
      TestLogic.restart();
    } else if (funbox === "layoutfluid") {
      UpdateConfig.setKeymapMode("next");
      Settings.groups.keymapMode.updateButton();
      UpdateConfig.setSavedLayout(Config.layout);
      UpdateConfig.setLayout("qwerty");
      Settings.groups.layout.updateButton();
      UpdateConfig.setKeymapLayout("qwerty");
      Settings.groups.keymapLayout.updateButton();
      TestLogic.restart();
    } else if (funbox === "memory") {
      UpdateConfig.setMode("words");
      UpdateConfig.setShowAllLines(true, true);
      TestLogic.restart(false, true);
      if (Config.keymapMode === "next") {
        UpdateConfig.setKeymapMode("react");
      }
    } else if (funbox === "nospace") {
      $("#words").addClass("nospace");
      UpdateConfig.setHighlightMode("letter", true);
      TestLogic.restart(false, true);
    }
    active = funbox;
  }

  if (funbox !== "layoutfluid" || mode !== "script") {
    if (Config.layout !== Config.savedLayout) {
      UpdateConfig.setLayout(Config.savedLayout);
      Settings.groups.layout.updateButton();
    }
  }
  TestUI.updateModesNotice();
  return true;
}
