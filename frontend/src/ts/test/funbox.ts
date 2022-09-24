import * as TestWords from "./test-words";
import * as Notifications from "../elements/notifications";
import * as Misc from "../utils/misc";
import * as ManualRestart from "./manual-restart-tracker";
import Config, * as UpdateConfig from "../config";
import * as TTS from "./tts";
import * as ModesNotice from "../elements/modes-notice";
import * as WeakSpot from "./weak-spot";
import { getPoem } from "./poetry";
import { getSection } from "./wikipedia";

interface Funbox {
  name: string;
  languageDependent?: boolean;
  noLingatures?: boolean;
  mode?: MonkeyTypes.Mode;
  blockWordHighlight?: boolean;
  getWord?: (wordset?: Misc.Wordset) => string;
  withWords?: (words: string[]) => Misc.Wordset;
  alterText?: (word: string) => string;
  applyCSS?: () => void;
  applyConfig?: () => void;
  rememberSettings?: () => void;
  toggleScript?: (params: string[]) => void;
  pullSection?: (language?: string) => Promise<Misc.Section | false>;
}

export const Funboxes: Funbox[] = [
  {
    name: "nausea",
    applyCSS(): void {
      $("#funBoxTheme").attr("href", `funbox/nausea.css`);
    },
  },
  {
    name: "round_round_baby",
    applyCSS(): void {
      $("#funBoxTheme").attr("href", `funbox/round_round_baby.css`);
    },
  },
  {
    name: "simon_says",
    applyCSS(): void {
      $("#funBoxTheme").attr("href", `funbox/simon_says.css`);
    },
    applyConfig(): void {
      UpdateConfig.setKeymapMode("next", true);
    },
    rememberSettings(): void {
      rememberSetting(
        "keymapMode",
        Config.keymapMode,
        UpdateConfig.setKeymapMode
      );
    },
  },
  {
    name: "mirror",
    applyCSS(): void {
      $("#funBoxTheme").attr("href", `funbox/mirror.css`);
    },
  },
  {
    name: "tts",
    blockWordHighlight: true,
    applyCSS(): void {
      $("#funBoxTheme").attr("href", `funbox/simon_says.css`);
    },
    applyConfig(): void {
      UpdateConfig.setKeymapMode("off", true);
      UpdateConfig.setHighlightMode("letter", true);
    },
    rememberSettings(): void {
      rememberSetting(
        "keymapMode",
        Config.keymapMode,
        UpdateConfig.setKeymapMode
      );
    },
    toggleScript(params: string[]): void {
      TTS.speak(params[0]);
    },
  },
  {
    name: "choo_choo",
    noLingatures: true,
    applyCSS(): void {
      $("#funBoxTheme").attr("href", `funbox/choo_choo.css`);
    },
  },
  {
    name: "arrows",
    blockWordHighlight: true,
    getWord(): string {
      return Misc.getArrows();
    },
    applyConfig(): void {
      $("#words").addClass("arrows");
      UpdateConfig.setHighlightMode("letter", true);
    },
    rememberSettings(): void {
      rememberSetting(
        "highlightMode",
        Config.highlightMode,
        UpdateConfig.setHighlightMode
      );
    },
  },
  {
    name: "rAnDoMcAsE",
    alterText(word: string): string {
      let randomcaseword = "";
      for (let i = 0; i < word.length; i++) {
        if (i % 2 != 0) {
          randomcaseword += word[i].toUpperCase();
        } else {
          randomcaseword += word[i];
        }
      }
      return randomcaseword;
    },
  },
  {
    name: "capitals",
    alterText(word: string): string {
      return Misc.capitalizeFirstLetterOfEachWord(word);
    },
  },
  {
    name: "layoutfluid",
    applyConfig(): void {
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
    },
    rememberSettings(): void {
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
    },
  },
  {
    name: "earthquake",
    noLingatures: true,
    applyCSS(): void {
      $("#funBoxTheme").attr("href", `funbox/earthquake.css`);
    },
  },
  {
    name: "space_balls",
    applyCSS(): void {
      $("#funBoxTheme").attr("href", `funbox/space_balls.css`);
    },
  },
  {
    name: "gibberish",
    getWord(): string {
      return Misc.getGibberish();
    },
  },
  {
    name: "58008",
    getWord(): string {
      let num = Misc.getNumbers(7);
      if (Config.language.startsWith("kurdish")) {
        num = Misc.convertNumberToArabicIndic(num);
      }
      return num;
    },
    rememberSettings(): void {
      rememberSetting("numbers", Config.numbers, UpdateConfig.setNumbers);
    },
  },
  {
    name: "ascii",
    getWord(): string {
      return Misc.getASCII();
    },
  },
  {
    name: "specials",
    getWord(): string {
      return Misc.getSpecials();
    },
  },
  {
    name: "plus_one",
  },
  {
    name: "plus_two",
  },
  {
    name: "read_ahead_easy",
    blockWordHighlight: true,
    applyCSS(): void {
      $("#funBoxTheme").attr("href", `funbox/read_ahead_easy.css`);
    },
    applyConfig(): void {
      UpdateConfig.setHighlightMode("letter", true);
    },
    rememberSettings(): void {
      rememberSetting(
        "highlightMode",
        Config.highlightMode,
        UpdateConfig.setHighlightMode
      );
    },
  },
  {
    name: "read_ahead",
    blockWordHighlight: true,
    applyCSS(): void {
      $("#funBoxTheme").attr("href", `funbox/read_ahead.css`);
    },
    applyConfig(): void {
      UpdateConfig.setHighlightMode("letter", true);
    },
    rememberSettings(): void {
      rememberSetting(
        "highlightMode",
        Config.highlightMode,
        UpdateConfig.setHighlightMode
      );
    },
  },
  {
    name: "read_ahead_hard",
    blockWordHighlight: true,
    applyCSS(): void {
      $("#funBoxTheme").attr("href", `funbox/read_ahead_hard.css`);
    },
    applyConfig(): void {
      UpdateConfig.setHighlightMode("letter", true);
    },
    rememberSettings(): void {
      rememberSetting(
        "highlightMode",
        Config.highlightMode,
        UpdateConfig.setHighlightMode
      );
    },
  },
  {
    name: "memory",
    mode: "words",
    applyConfig(): void {
      if (this.mode) UpdateConfig.setMode(this.mode, true);
      UpdateConfig.setShowAllLines(true, true);
      if (Config.keymapMode === "next") {
        UpdateConfig.setKeymapMode("react", true);
      }
    },
    rememberSettings(): void {
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
    },
  },
  {
    name: "nospace",
    blockWordHighlight: true,
    applyConfig(): void {
      $("#words").addClass("nospace");
      UpdateConfig.setHighlightMode("letter", true);
    },
    rememberSettings(): void {
      rememberSetting(
        "highlightMode",
        Config.highlightMode,
        UpdateConfig.setHighlightMode
      );
    },
  },
  {
    name: "poetry",
    async pullSection(): Promise<Misc.Section | false> {
      return getPoem();
    },
  },
  {
    name: "wikipedia",
    async pullSection(lang?: string): Promise<Misc.Section | false> {
      return getSection(lang ? lang : "english");
    },
  },
  {
    name: "weakspot",
    languageDependent: true,
    getWord(wordset?: Misc.Wordset): string {
      if (wordset !== undefined) return WeakSpot.getWord(wordset);
      else return "";
    },
  },
  {
    name: "pseudolang",
    withWords(words: string[]): Misc.Wordset {
      return new Misc.PseudolangWordGenerator(words);
    },
  },
];

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
  Funboxes.forEach((funbox) => {
    if (Config.funbox.split("#").includes(funbox.name)) {
      if (funbox.toggleScript) funbox.toggleScript(params);
    }
  });
}

let modeSaved: MonkeyTypes.FunboxObjectType[] = [];
async function updateModes(
  funbox: string
): Promise<MonkeyTypes.FunboxObjectType[]> {
  if (funbox === "none") {
    modeSaved = [];
  } else {
    const list = await Misc.getFunboxList();
    modeSaved = [];
    for (let i = 0; i < funbox.split("#").length; i++) {
      modeSaved[i] = list.filter(
        (f) => f.name === funbox?.split("#")[i]
      )[0].type;
    }
  }
  return modeSaved;
}

export function checkFunbox(
  funbox: string,
  mode: MonkeyTypes.FunboxObjectType
): boolean {
  if (funbox === "none") return true;
  if (Config.funbox.split("#").length != modeSaved.length) {
    updateModes(Config.funbox).then();
  }
  return !(
    (modeSaved.includes(mode) && mode != "modificator") ||
    (mode == "quote" &&
      (modeSaved.includes("wordlist") || modeSaved.includes("modificator"))) ||
    ((mode == "wordlist" || mode == "modificator") &&
      modeSaved.includes("quote")) ||
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
    (funbox == "rAnDoMcAsE" && Config.funbox.includes("capitals")) ||
    ((modeSaved.includes("style") || modeSaved.includes("script")) &&
      funbox == "simon_says") ||
    ((mode == "style" || mode == "script") &&
      Config.funbox.includes("simon_says")) ||
    (funbox == "space_balls" &&
      modeSaved.includes("script") &&
      !(
        Config.funbox.includes("plus_one") || Config.funbox.includes("plus_two")
      )) ||
    (Config.funbox.includes("space_balls") &&
      mode == "script" &&
      !(funbox == "plus_one" || funbox == "plus_two")) ||
    (mode == "script" &&
      modeSaved.includes("style") &&
      !Config.funbox.includes("space_balls")) ||
    (modeSaved.includes("script") &&
      mode == "style" &&
      funbox != "space_balls") ||
    (mode == "script" && Config.funbox.includes("memory")) ||
    (modeSaved.includes("script") && funbox == "memory") ||
    (funbox == "arrows" && Config.funbox.includes("choo_choo")) ||
    (funbox == "choo_choo" && Config.funbox.includes("arrows"))
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
    (!checkFunbox(funbox, mode) && !Config.funbox.split("#").includes(funbox))
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
  if (funbox === undefined || funbox === null) {
    funbox = Config.funbox;
  }

  // if (funbox === "none") {
  reset();
  $("#wordsWrapper").removeClass("hidden");
  // }

  if (funbox.split("#").length != modeSaved.length) await updateModes(funbox);
  const mode = modeSaved;

  $("#funBoxTheme").attr("href", ``);
  $("#words").removeClass("nospace");
  $("#words").removeClass("arrows");
  if ((await Misc.getCurrentLanguage(Config.language)).ligatures) {
    Funboxes.forEach(async (funbox) => {
      if (Config.funbox.split("#").includes(funbox.name)) {
        if (funbox.noLingatures) {
          Notifications.add(
            "Current language does not support this funbox mode",
            0
          );
          UpdateConfig.setFunbox("none", true);
          await clear();
          return;
        }
      }
    });
  }
  if (funbox !== "none" && (Config.mode === "zen" || Config.mode == "quote")) {
    if (mode.includes("wordlist") || mode.includes("modificator")) {
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
    Funboxes.forEach(async (funbox) => {
      if (Config.funbox.split("#").includes(funbox.name)) {
        if (funbox.applyCSS) funbox.applyCSS();
        if (funbox.applyConfig) funbox.applyConfig();
      }
    });
  }
  // ModesNotice.update();
  return true;
}

export async function rememberSettings(): Promise<void> {
  Funboxes.forEach(async (funbox) => {
    if (Config.funbox.split("#").includes(funbox.name)) {
      if (funbox.rememberSettings) funbox.rememberSettings();
    }
  });
}
