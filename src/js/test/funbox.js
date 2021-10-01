import * as TestLogic from "./test-logic";
import * as Notifications from "./notifications";
import * as TestUI from "./test-ui";
import * as Misc from "./misc";
import * as ManualRestart from "./manual-restart-tracker";
import Config, * as UpdateConfig from "./config";
import * as Settings from "./settings";
import * as TTS from "./tts";

let modeSaved = null;
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
  resetMemoryTimer();
}

export function toggleScript(...params) {
  if (Config.funbox === "tts") {
    TTS.speak(params[0]);
  }
}

export function setFunbox(funbox, mode) {
  if (funbox === "none") loadMemory();
  modeSaved = mode;
  UpdateConfig.setFunbox(funbox, false);
  return true;
}

export async function activate(funbox) {
  let mode = modeSaved;

  if (funbox === undefined || funbox === null) {
    funbox = Config.funbox;
  }

  if (await Misc.getCurrentLanguage().ligatures) {
    if (funbox == "choo_choo" || funbox == "earthquake") {
      Notifications.add(
        "Current language does not support this funbox mode",
        0
      );
      setFunbox("none", null);
      return;
    }
  }
  if (Config.mode === "zen" && funbox == "layoutfluid") {
    Notifications.add(`Zen mode does not support the ${funbox} funbox`, 0);
    setFunbox("none", null);
    TestLogic.restart(undefined, true);
    return;
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
    if (funbox != undefined)
      $("#funBoxTheme").attr("href", `funbox/${funbox}.css`);

    if (funbox === "simon_says") {
      rememberSetting(
        "keymapMode",
        Config.keymapMode,
        UpdateConfig.setKeymapMode
      );
      UpdateConfig.setKeymapMode("next", true);
      Settings.groups.keymapMode.updateButton();
      TestLogic.restart(undefined, true);
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
      TestLogic.restart(undefined, true);
    }
  } else if (mode === "script") {
    if (funbox === "tts") {
      $("#funBoxTheme").attr("href", `funbox/simon_says.css`);
      rememberSetting(
        "keymapMode",
        Config.keymapMode,
        UpdateConfig.setKeymapMode
      );
      UpdateConfig.setKeymapMode("off", true);
      UpdateConfig.setHighlightMode("letter", true);
      Settings.groups.keymapMode.updateButton();
      TestLogic.restart(undefined, true);
    } else if (funbox === "layoutfluid") {
      rememberSetting(
        "keymapMode",
        Config.keymapMode,
        UpdateConfig.setKeymapMode
      );
      // UpdateConfig.setKeymapMode("next");
      Settings.groups.keymapMode.updateButton();
      // UpdateConfig.setSavedLayout(Config.layout);
      rememberSetting("layout", Config.layout, UpdateConfig.setLayout);
      UpdateConfig.setLayout(
        Config.customLayoutfluid
          ? Config.customLayoutfluid.split("#")[0]
          : "qwerty",
        true
      );
      Settings.groups.layout.updateButton();
      rememberSetting(
        "keymapLayout",
        Config.keymapLayout,
        UpdateConfig.setKeymapLayout
      );
      UpdateConfig.setKeymapLayout(
        Config.customLayoutfluid
          ? Config.customLayoutfluid.split("#")[0]
          : "qwerty",
        true
      );
      Settings.groups.keymapLayout.updateButton();
      TestLogic.restart(undefined, true);
    } else if (funbox === "memory") {
      rememberSetting("mode", Config.mode, UpdateConfig.setMode);
      UpdateConfig.setMode("words", true);
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
        UpdateConfig.setKeymapMode("react", true);
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
