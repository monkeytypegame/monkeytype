import * as TestLogic from "./test-logic";
import * as Notifications from "./notifications";
import * as TestUI from "./test-ui";
import * as Misc from "./misc";
import * as ManualRestart from "./manual-restart-tracker";
import Config, * as UpdateConfig from "./config";
import * as Settings from "./settings";

export let active = "none";
export let funboxSaved = "none";
export let modeSaved = null;
let memoryTimer = null;
let memoryInterval = null;

let settingsMemory = {};

function rememberSetting(settingName, value, setFunction) {
  settingsMemory[settingName] ??= {
    value,
    setFunction,
  };
}

function loadMemory() {
  Notifications.add("Reverting funbox settings", 0);
  Object.keys(settingsMemory).forEach((setting) => {
    setting = settingsMemory[setting];
    setting.setFunction(setting.value, true);
  });
  settingsMemory = {};
}

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
  if (funbox === undefined || funbox === null) {
    funbox = funboxSaved;
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
  if (funbox === "none" && mode === undefined) {
    mode = null;
  } else if (
    (funbox !== "none" && mode === undefined) ||
    (funbox !== "none" && mode === null)
  ) {
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
      rememberSetting(
        "keymapMode",
        Config.keymapMode,
        UpdateConfig.setKeymapMode
      );
      UpdateConfig.setKeymapMode("next");
      Settings.groups.keymapMode.updateButton();
      TestLogic.restart();
    }

    if (
      funbox === "read_ahead" ||
      funbox === "read_ahead_easy" ||
      funbox === "read_ahead_hard"
    ) {
      rememberSetting(
        "highlightMode",
        Config.highlightMode,
        UpdateConfig.setHighlightMode
      );
      UpdateConfig.setHighlightMode("letter", true);
      TestLogic.restart();
    }
  } else if (mode === "script") {
    if (funbox === "tts") {
      $("#funBoxTheme").attr("href", `funbox/simon_says.css`);
      rememberSetting(
        "keymapMode",
        Config.keymapMode,
        UpdateConfig.setKeymapMode
      );
      UpdateConfig.setKeymapMode("off");
      Settings.groups.keymapMode.updateButton();
      TestLogic.restart();
    } else if (funbox === "layoutfluid") {
      rememberSetting(
        "keymapMode",
        Config.keymapMode,
        UpdateConfig.setKeymapMode
      );
      UpdateConfig.setKeymapMode("next");
      Settings.groups.keymapMode.updateButton();
      // UpdateConfig.setSavedLayout(Config.layout);
      rememberSetting("layout", Config.layout, UpdateConfig.setLayout);
      UpdateConfig.setLayout("qwerty");
      Settings.groups.layout.updateButton();
      rememberSetting(
        "keymapLayout",
        Config.keymapLayout,
        UpdateConfig.setKeymapLayout
      );
      UpdateConfig.setKeymapLayout("qwerty");
      Settings.groups.keymapLayout.updateButton();
      TestLogic.restart();
    } else if (funbox === "memory") {
      rememberSetting("mode", Config.mode, UpdateConfig.setMode);
      UpdateConfig.setMode("words");
      rememberSetting(
        "showAllLines",
        Config.showAllLines,
        UpdateConfig.setShowAllLines
      );
      UpdateConfig.setShowAllLines(true, true);
      TestLogic.restart(false, true);
      if (Config.keymapMode === "next") {
        rememberSetting(
          "keymapMode",
          Config.keymapMode,
          UpdateConfig.setKeymapMode
        );
        UpdateConfig.setKeymapMode("react");
      }
    } else if (funbox === "nospace") {
      $("#words").addClass("nospace");
      rememberSetting(
        "highlightMode",
        Config.highlightMode,
        UpdateConfig.setHighlightMode
      );
      UpdateConfig.setHighlightMode("letter", true);
      TestLogic.restart(false, true);
    }
    active = funbox;
  }

  // if (funbox !== "layoutfluid" || mode !== "script") {
  //   if (Config.layout !== Config.savedLayout) {
  //     UpdateConfig.setLayout(Config.savedLayout);
  //     Settings.groups.layout.updateButton();
  //   }
  // }
  TestUI.updateModesNotice();
  return true;
}
export function setFunbox(funbox, mode) {
  if (TestLogic.active || TestUI.resultVisible) {
    Notifications.add(
      "You can only change the funbox before starting a test.",
      0
    );
    return false;
  }
  if (funbox === "none") loadMemory();
  funboxSaved = funbox;
  modeSaved = mode;
  active = funbox;
  return true;
}
