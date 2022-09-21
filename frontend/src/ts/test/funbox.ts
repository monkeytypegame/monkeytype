import * as TestWords from "./test-words";
import * as Notifications from "../elements/notifications";
import * as Misc from "../utils/misc";
import * as ManualRestart from "./manual-restart-tracker";
import Config, * as UpdateConfig from "../config";
import * as TTS from "./tts";
import * as ModesNotice from "../elements/modes-notice";

let modeSaved: MonkeyTypes.FunboxObjectType[] = [];
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
  if (Config.funbox.split("#").includes("tts")) {
    TTS.speak(params[0]);
  }
}

export function checkFunbox(
  funbox: string,
  mode: MonkeyTypes.FunboxObjectType
): boolean {
  if (funbox === "none") return true;
  return !(
    (modeSaved?.includes(mode) && mode != "modificator") ||
    (mode == "quote" &&
      (modeSaved?.includes("wordlist") ||
        modeSaved?.includes("modificator"))) ||
    ((mode == "wordlist" || mode == "modificator") &&
      modeSaved?.includes("quote")) ||
    ((funbox == "capitals" || funbox == "rAnDoMcAsE") &&
      (Config.funbox.includes("58008") ||
        Config.funbox.includes("arrows") ||
        Config.funbox.includes("ascii") ||
        Config.funbox.includes("specials"))) ||
    ((funbox == "58008" ||
      funbox == "arrows" ||
      funbox == "ascii" ||
      funbox == "specials") &&
      (Config.funbox.includes("capitals") ||
        Config.funbox.includes("rAnDoMcAsE"))) ||
    (funbox == "arrows" && Config.funbox.includes("nospace")) ||
    (funbox == "nospace" && Config.funbox.includes("arrows")) ||
    (funbox == "capitals" && Config.funbox.includes("rAnDoMcAsE")) ||
    (funbox == "rAnDoMcAsE" && Config.funbox.includes("capitals"))
  );
}

export function setFunbox(
  funbox: string,
  mode: MonkeyTypes.FunboxObjectType | null
): boolean {
  modeSaved = mode ? [mode] : [];
  loadMemory();
  UpdateConfig.setFunbox(funbox, false);
  return true;
}

export function toggleFunbox(
  funbox: string,
  mode: MonkeyTypes.FunboxObjectType | null
): boolean {
  if (
    funbox == "none" ||
    mode === null ||
    (!checkFunbox(funbox, mode) && !Config.funbox.includes(funbox))
  ) {
    setFunbox("none", null);
    return true;
  }
  loadMemory();
  const e = UpdateConfig.toggleFunbox(funbox, false);
  if (e === false || e === true) return false;
  if (e < 0) {
    modeSaved?.splice(-e - 1, 1);
  } else {
    modeSaved?.splice(e, 0, mode);
  }
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

  // if (funbox === "none") {
  reset();
  $("#wordsWrapper").removeClass("hidden");
  // }

  if (funbox === "none") {
    mode = [];
  } else {
    const list = await Misc.getFunboxList();
    mode = [];
    for (let i = 0; i < funbox.split("#").length; i++) {
      mode[i] = list.filter((f) => f.name === funbox?.split("#")[i])[0].type;
    }
  }
  modeSaved = mode;

  $("#funBoxTheme").attr("href", ``);
  $("#words").removeClass("nospace");
  $("#words").removeClass("arrows");
  if ((await Misc.getCurrentLanguage(Config.language)).ligatures) {
    if (
      funbox.split("#").includes("choo_choo") ||
      funbox.split("#").includes("earthquake")
    ) {
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
    if (mode?.includes("wordlist") || mode?.includes("modificator")) {
      Notifications.add(
        `${Misc.capitalizeFirstLetterOfEachWord(
          Config.mode
        )} mode does not support the ${funbox} funbox`,
        0
      );
      UpdateConfig.setMode("time", true);
    }
    if (mode?.includes("quote")) {
      Notifications.add(
        `${Misc.capitalizeFirstLetterOfEachWord(
          Config.mode
        )} mode does not support the ${funbox} funbox`,
        0
      );
      UpdateConfig.setMode("time", true);
    }
  }
  if (
    (Config.time === 0 && Config.mode === "time") ||
    (Config.words === 0 && Config.mode === "words")
  ) {
    if (mode?.includes("quote")) {
      Notifications.add(
        `${Misc.capitalizeFirstLetterOfEachWord(
          Config.mode
        )} mode with value 0 does not support the ${funbox} funbox`,
        0
      );
      if (Config.mode === "time") UpdateConfig.setTimeConfig(15, true);
      if (Config.mode === "words") UpdateConfig.setWordCount(10, true);
    }
  }

  ManualRestart.set();
  if (funbox !== "none") {
    for (let i = 0; i < funbox.split("#").length; i++) {
      if (mode[i] === "style") {
        if (funbox.split("#")[i] != undefined) {
          $("#funBoxTheme").attr("href", `funbox/${funbox.split("#")[i]}.css`);
        }

        if (funbox.split("#")[i] === "simon_says") {
          UpdateConfig.setKeymapMode("next", true);
        }

        if (
          funbox.split("#")[i] === "read_ahead" ||
          funbox.split("#")[i] === "read_ahead_easy" ||
          funbox.split("#")[i] === "read_ahead_hard"
        ) {
          UpdateConfig.setHighlightMode("letter", true);
        }
      } else if (mode[i] !== null) {
        if (funbox.split("#")[i] === "tts") {
          $("#funBoxTheme").attr("href", `funbox/simon_says.css`);
          UpdateConfig.setKeymapMode("off", true);
          UpdateConfig.setHighlightMode("letter", true);
        } else if (funbox.split("#")[i] === "layoutfluid") {
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
        } else if (funbox.split("#")[i] === "memory") {
          UpdateConfig.setMode("words", true);
          UpdateConfig.setShowAllLines(true, true);
          if (Config.keymapMode === "next") {
            UpdateConfig.setKeymapMode("react", true);
          }
        } else if (funbox.split("#")[i] === "nospace") {
          $("#words").addClass("nospace");
          UpdateConfig.setHighlightMode("letter", true);
        } else if (funbox.split("#")[i] === "arrows") {
          $("#words").addClass("arrows");
          UpdateConfig.setHighlightMode("letter", true);
        }
      }
    }
  }
  // ModesNotice.update();
  return true;
}

export async function rememberSettings(): Promise<void> {
  const funbox = Config.funbox;
  let mode = modeSaved;
  if (funbox === "none") {
    mode = [];
  } else {
    const list = await Misc.getFunboxList();
    mode = [];
    for (let i = 0; i < funbox.split("#").length; i++) {
      mode[i] = list.filter((f) => f.name === funbox?.split("#")[i])[0].type;
    }
  }
  if (mode.includes("style")) {
    if (funbox.split("#").includes("simon_says")) {
      rememberSetting(
        "keymapMode",
        Config.keymapMode,
        UpdateConfig.setKeymapMode
      );
    }

    if (
      funbox.split("#").includes("read_ahead") ||
      funbox.split("#").includes("read_ahead_easy") ||
      funbox.split("#").includes("read_ahead_hard")
    ) {
      rememberSetting(
        "highlightMode",
        Config.highlightMode,
        UpdateConfig.setHighlightMode
      );
    }
  } else if (mode.includes("script")) {
    if (funbox.split("#").includes("tts")) {
      rememberSetting(
        "keymapMode",
        Config.keymapMode,
        UpdateConfig.setKeymapMode
      );
    } else if (funbox.split("#").includes("layoutfluid")) {
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
    } else if (funbox.split("#").includes("memory")) {
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
    } else if (funbox.split("#").includes("nospace")) {
      rememberSetting(
        "highlightMode",
        Config.highlightMode,
        UpdateConfig.setHighlightMode
      );
    } else if (funbox.split("#").includes("arrows")) {
      rememberSetting(
        "highlightMode",
        Config.highlightMode,
        UpdateConfig.setHighlightMode
      );
    } else if (funbox.split("#").includes("58008")) {
      rememberSetting("numbers", Config.numbers, UpdateConfig.setNumbers);
    }
  }
}
