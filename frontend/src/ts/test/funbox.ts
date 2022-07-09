import * as TestWords from "./test-words";
import * as Notifications from "../elements/notifications";
import * as Misc from "../utils/misc";
import * as ManualRestart from "./manual-restart-tracker";
import Config, * as UpdateConfig from "../config";
import * as TTS from "./tts";
import * as ModesNotice from "../elements/modes-notice";

let modeSaved: MonkeyTypes.FunboxObjectType | null = null;
let memoryTimer: number | null = null;
let memoryInterval: NodeJS.Timeout | null = null;

type SetFunction = (...params: any[]) => any;

let settingsMemory: {
  [key: string]: { value: any; setFunction: SetFunction };
} = {};

function rememberSetting(
  settingName: string,
  value: any,
  setFunction: SetFunction
): void {
  settingsMemory[settingName] ??= {
    value,
    setFunction,
  };
}

function loadMemory(): void {
  Notifications.add("Reverting funbox settings", 0);
  Object.keys(settingsMemory).forEach((setting) => {
    settingsMemory[setting].setFunction(settingsMemory[setting].value, true);
  });
  settingsMemory = {};
}

function showMemoryTimer(): void {
  $("#typingTest #memoryTimer").stop(true, true).animate(
    {
      opacity: 1,
    },
    125
  );
}

function hideMemoryTimer(): void {
  $("#typingTest #memoryTimer").stop(true, true).animate(
    {
      opacity: 0,
    },
    125
  );
}

export function resetMemoryTimer(): void {
  if (memoryInterval !== null) {
    clearInterval(memoryInterval);
    memoryInterval = null;
  }
  memoryTimer = null;
  hideMemoryTimer();
}

function updateMemoryTimer(sec: number): void {
  $("#typingTest #memoryTimer").text(
    `Timer left to memorise all words: ${sec}s`
  );
}

export function startMemoryTimer(): void {
  resetMemoryTimer();
  memoryTimer = Math.round(Math.pow(TestWords.words.length, 1.2));
  updateMemoryTimer(memoryTimer);
  showMemoryTimer();
  memoryInterval = setInterval(() => {
    if (memoryTimer === null) return;
    memoryTimer -= 1;
    memoryTimer == 0 ? hideMemoryTimer() : updateMemoryTimer(memoryTimer);
    if (memoryTimer <= 0) {
      resetMemoryTimer();
      $("#wordsWrapper").addClass("hidden");
    }
  }, 1000);
}

export function reset(): void {
  resetMemoryTimer();
}

export function toggleScript(...params: string[]): void {
  if (Config.funbox === "tts") {
    TTS.speak(params[0]);
  }
}

export function setFunbox(
  funbox: string,
  mode: MonkeyTypes.FunboxObjectType | null
): boolean {
  modeSaved = mode;
  UpdateConfig.setFunbox(funbox, false);
  if (funbox === "none") loadMemory();
  return true;
}

export async function clear(): Promise<boolean> {
  $("#funBoxTheme").attr("href", ``);
  $("#words").removeClass("nospace");
  $("#words").removeClass("arrows");
  reset();
  $("#wordsWrapper").removeClass("hidden");
  ManualRestart.set();
  ModesNotice.update();
  return true;
}

export async function activate(funbox?: string): Promise<boolean | undefined> {
  let mode = modeSaved;

  if (funbox === undefined || funbox === null) {
    funbox = Config.funbox;
  }

  const funboxInfo = await Misc.getFunbox(funbox);

  $("#funBoxTheme").attr("href", ``);
  $("#words").removeClass("nospace");
  $("#words").removeClass("arrows");
  if ((await Misc.getCurrentLanguage(Config.language)).ligatures) {
    if (funbox == "choo_choo" || funbox == "earthquake") {
      Notifications.add(
        "Current language does not support this funbox mode",
        0
      );
      UpdateConfig.setFunbox("none", true);
      await clear();
      return;
    }
  }
  if (funbox !== "none" && (Config.mode === "zen" || Config.mode == "quote")) {
    if (funboxInfo?.affectsWordGeneration === true) {
      Notifications.add(
        `${Misc.capitalizeFirstLetterOfEachWord(
          Config.mode
        )} mode does not support the ${funbox} funbox`,
        0
      );
      UpdateConfig.setFunbox("none", true);
      await clear();
      return;
    }
  }
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
    const list = await Misc.getFunboxList();
    mode = list.filter((f) => f.name === funbox)[0].type;
  }

  ManualRestart.set();
  if (mode === "style") {
    if (funbox != undefined) {
      $("#funBoxTheme").attr("href", `funbox/${funbox}.css`);
    }

    if (funbox === "simon_says") {
      UpdateConfig.setKeymapMode("next", true);
    }

    if (
      funbox === "read_ahead" ||
      funbox === "read_ahead_easy" ||
      funbox === "read_ahead_hard"
    ) {
      UpdateConfig.setHighlightMode("letter", true);
    }
  } else if (mode === "script") {
    if (funbox === "tts") {
      $("#funBoxTheme").attr("href", `funbox/simon_says.css`);
      UpdateConfig.setKeymapMode("off", true);
      UpdateConfig.setHighlightMode("letter", true);
    } else if (funbox === "layoutfluid") {
      UpdateConfig.setLayout(
        Config.customLayoutfluid
          ? Config.customLayoutfluid.split("#")[0]
          : "qwerty",
        true
      );
      UpdateConfig.setKeymapLayout(
        Config.customLayoutfluid
          ? Config.customLayoutfluid.split("#")[0]
          : "qwerty",
        true
      );
    } else if (funbox === "memory") {
      UpdateConfig.setMode("words", true);
      UpdateConfig.setShowAllLines(true, true);
      if (Config.keymapMode === "next") {
        UpdateConfig.setKeymapMode("react", true);
      }
    } else if (funbox === "nospace") {
      $("#words").addClass("nospace");
      UpdateConfig.setHighlightMode("letter", true);
    } else if (funbox === "arrows") {
      $("#words").addClass("arrows");
      UpdateConfig.setHighlightMode("letter", true);
    }
  }
  // ModesNotice.update();
  return true;
}

export async function rememberSettings(): Promise<void> {
  const funbox = Config.funbox;
  let mode = modeSaved;
  if (funbox === "none" && mode === undefined) {
    mode = null;
  } else if (
    (funbox !== "none" && mode === undefined) ||
    (funbox !== "none" && mode === null)
  ) {
    const list = await Misc.getFunboxList();
    mode = list.filter((f) => f.name === funbox)[0].type;
  }
  if (mode === "style") {
    if (funbox === "simon_says") {
      rememberSetting(
        "keymapMode",
        Config.keymapMode,
        UpdateConfig.setKeymapMode
      );
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
    }
  } else if (mode === "script") {
    if (funbox === "tts") {
      rememberSetting(
        "keymapMode",
        Config.keymapMode,
        UpdateConfig.setKeymapMode
      );
    } else if (funbox === "layoutfluid") {
      rememberSetting(
        "keymapMode",
        Config.keymapMode,
        UpdateConfig.setKeymapMode
      );
      rememberSetting("layout", Config.layout, UpdateConfig.setLayout);
      rememberSetting(
        "keymapLayout",
        Config.keymapLayout,
        UpdateConfig.setKeymapLayout
      );
    } else if (funbox === "memory") {
      rememberSetting("mode", Config.mode, UpdateConfig.setMode);
      rememberSetting(
        "showAllLines",
        Config.showAllLines,
        UpdateConfig.setShowAllLines
      );
      if (Config.keymapMode === "next") {
        rememberSetting(
          "keymapMode",
          Config.keymapMode,
          UpdateConfig.setKeymapMode
        );
      }
    } else if (funbox === "nospace") {
      rememberSetting(
        "highlightMode",
        Config.highlightMode,
        UpdateConfig.setHighlightMode
      );
    } else if (funbox === "arrows") {
      rememberSetting(
        "highlightMode",
        Config.highlightMode,
        UpdateConfig.setHighlightMode
      );
    } else if (funbox === "58008") {
      rememberSetting("numbers", Config.numbers, UpdateConfig.setNumbers);
    }
  }
}
