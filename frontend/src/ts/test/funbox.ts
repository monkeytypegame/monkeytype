import * as TestWords from "./test-words";
import * as Notifications from "../elements/notifications";
import * as Misc from "../utils/misc";
import * as ManualRestart from "./manual-restart-tracker";
import Config, * as UpdateConfig from "../config";
import * as ModesNotice from "../elements/modes-notice";
import * as TestInput from "../test/test-input";
import * as Keymap from "../elements/keymap";
import * as Settings from "../pages/settings";
import * as TTS from "./tts";
import * as WeakSpot from "./weak-spot";
import { getPoem } from "./poetry";
import { getSection } from "./wikipedia";

export const Funboxes: MonkeyTypes.Funbox[] = [
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
    conflictsWithSymmetricChars: true,
    applyCSS(): void {
      $("#funBoxTheme").attr("href", `funbox/choo_choo.css`);
    },
  },
  {
    name: "arrows",
    blockWordHighlight: true,
    ignoresLanguage: true,
    nospace: true,
    noPunctuation: true,
    noNumbers: true,
    noLetters: true,
    symmetricChars: true,
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
    isCharCorrect(char: string, originalChar: string): boolean {
      if (
        (char === Config.arrowKeys[0] || char === "ArrowLeft") &&
        originalChar === "←"
      ) {
        return true;
      }
      if (
        (char === Config.arrowKeys[1] || char === "ArrowDown") &&
        originalChar === "↓"
      ) {
        return true;
      }
      if (
        (char === Config.arrowKeys[2] || char === "ArrowUp") &&
        originalChar === "↑"
      ) {
        return true;
      }
      if (
        (char === Config.arrowKeys[3] || char === "ArrowRight") &&
        originalChar === "→"
      ) {
        return true;
      }
      return false;
    },
    async preventDefaultEvent(
      event: JQuery.KeyDownEvent<Document, null, Document, Document>
    ): Promise<boolean> {
      // TODO What's better?
      // return /Arrow/i.test(event.key);
      return ["ArrowLeft", "ArrowUp", "ArrowRight", "ArrowDown"].includes(
        event.key
      );
    },
  },
  {
    name: "rAnDoMcAsE",
    changesCapitalisation: true,
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
    changesCapitalisation: true,
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
    handleSpace(): void {
      if (Config.mode !== "time") {
        // here I need to check if Config.customLayoutFluid exists because of my
        // scuffed solution of returning whenever value is undefined in the setCustomLayoutfluid function
        const layouts: string[] = Config.customLayoutfluid
          ? Config.customLayoutfluid.split("#")
          : ["qwerty", "dvorak", "colemak"];
        let index = 0;
        const outOf: number = TestWords.words.length;
        index = Math.floor(
          (TestInput.input.history.length + 1) / (outOf / layouts.length)
        );
        if (Config.layout !== layouts[index] && layouts[index] !== undefined) {
          Notifications.add(`--- !!! ${layouts[index]} !!! ---`, 0);
        }
        UpdateConfig.setLayout(layouts[index]);
        UpdateConfig.setKeymapLayout(layouts[index]);
        Keymap.highlightKey(
          TestWords.words
            .getCurrent()
            .charAt(TestInput.input.current.length)
            .toString()
        );
        Settings.groups["layout"]?.updateInput();
      }
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
    ignoresLanguage: true,
    getWord(): string {
      return Misc.getGibberish();
    },
  },
  {
    name: "58008",
    noNumbers: true,
    ignoresLanguage: true,
    noLetters: true,
    getWord(): string {
      let num = Misc.getNumbers(7);
      if (Config.language.startsWith("kurdish")) {
        num = Misc.convertNumberToArabicIndic(num);
      }
      return num;
    },
    punctuateWord(word: string): string {
      if (word.length > 3) {
        if (Math.random() < 0.5) {
          word = Misc.setCharAt(
            word,
            Misc.randomIntFromRange(1, word.length - 2),
            "."
          );
        }
        if (Math.random() < 0.75) {
          const index = Misc.randomIntFromRange(1, word.length - 2);
          if (
            word[index - 1] !== "." &&
            word[index + 1] !== "." &&
            word[index + 1] !== "0"
          ) {
            const special = Misc.randomElementFromArray(["/", "*", "-", "+"]);
            word = Misc.setCharAt(word, index, special);
          }
        }
      }
      return word;
    },
    rememberSettings(): void {
      rememberSetting("numbers", Config.numbers, UpdateConfig.setNumbers);
    },
    handleChar(char: string): string {
      if (char === "\n") {
        return " ";
      }
      return char;
    },
  },
  {
    name: "ascii",
    ignoresLanguage: true,
    noPunctuation: true,
    noNumbers: true,
    noLetters: true,
    getWord(): string {
      return Misc.getASCII();
    },
  },
  {
    name: "specials",
    ignoresLanguage: true,
    noPunctuation: true,
    noNumbers: true,
    noLetters: true,
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
    nospace: true,
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
    noPunctuation: true,
    noNumbers: true,
    async pullSection(): Promise<Misc.Section | false> {
      return getPoem();
    },
  },
  {
    name: "wikipedia",
    noPunctuation: true,
    noNumbers: true,
    async pullSection(lang?: string): Promise<Misc.Section | false> {
      return getSection(lang ? lang : "english");
    },
  },
  {
    name: "weakspot",
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
  UpdateConfig.ActiveFunboxes.forEach((funbox) => {
    if (funbox.toggleScript) funbox.toggleScript(params);
  });
}

export function checkFunbox(funbox: string): boolean {
  if (funbox === "none" || Config.funbox === "none") return true;
  UpdateConfig.initFunboxes();
  // return !(
  //   (modeSaved.includes(mode) && mode != "modificator") ||
  //   (mode == "quote" &&
  //     (modeSaved.includes("wordlist") || modeSaved.includes("modificator"))) ||
  //   ((mode == "wordlist" || mode == "modificator") &&
  //     modeSaved.includes("quote")) ||
  //   ((funbox == "capitals" || funbox == "rAnDoMcAsE") &&
  //     (Config.funbox.includes("58008") ||
  //       Config.funbox.includes("arrows") ||
  //       Config.funbox.includes("ascii") ||
  //       Config.funbox.includes("specials"))) ||
  //   ((funbox == "58008" ||
  //     funbox == "arrows" ||
  //     funbox == "ascii" ||
  //     funbox == "specials") &&
  //     (Config.funbox.includes("capitals") ||
  //       Config.funbox.includes("rAnDoMcAsE"))) ||
  //   (funbox == "arrows" && Config.funbox.includes("nospace")) ||
  //   (funbox == "nospace" && Config.funbox.includes("arrows")) ||
  //   (funbox == "capitals" && Config.funbox.includes("rAnDoMcAsE")) ||
  //   (funbox == "rAnDoMcAsE" && Config.funbox.includes("capitals")) ||
  //   ((modeSaved.includes("style") || modeSaved.includes("script")) &&
  //     funbox == "simon_says") ||
  //   ((mode == "style" || mode == "script") &&
  //     Config.funbox.includes("simon_says")) ||
  //   (funbox == "space_balls" &&
  //     modeSaved.includes("script") &&
  //     !(
  //       Config.funbox.includes("plus_one") || Config.funbox.includes("plus_two")
  //     )) ||
  //   (Config.funbox.includes("space_balls") &&
  //     mode == "script" &&
  //     !(funbox == "plus_one" || funbox == "plus_two")) ||
  //   (mode == "script" &&
  //     modeSaved.includes("style") &&
  //     !Config.funbox.includes("space_balls")) ||
  //   (modeSaved.includes("script") &&
  //     mode == "style" &&
  //     funbox != "space_balls") ||
  //   (mode == "script" && Config.funbox.includes("memory")) ||
  //   (modeSaved.includes("script") && funbox == "memory") ||
  //   (funbox == "arrows" && Config.funbox.includes("choo_choo")) ||
  //   (funbox == "choo_choo" && Config.funbox.includes("arrows"))
  // );
  const checkingFunbox = UpdateConfig.ActiveFunboxes.concat(
    Funboxes.filter((f) => f.name == funbox)
  );
  return !(
    checkingFunbox.filter((f) => f.getWord).length > 1 ||
    checkingFunbox.filter((f) => f.applyCSS).length > 1 ||
    checkingFunbox.filter((f) => f.pullSection).length > 1 ||
    checkingFunbox.filter((f) => f.punctuateWord).length > 1 ||
    checkingFunbox.filter((f) => f.isCharCorrect).length > 1 ||
    checkingFunbox.filter((f) => f.nospace).length > 1 ||
    (checkingFunbox.filter((f) => f.getWord).length > 0 &&
      checkingFunbox.filter((f) => f.pullSection).length > 0) ||
    (checkingFunbox.filter((f) => f.noLetters).length > 0 &&
      checkingFunbox.filter((f) => f.changesCapitalisation).length > 0) ||
    (checkingFunbox.filter((f) => f.conflictsWithSymmetricChars).length > 0 &&
      checkingFunbox.filter((f) => f.symmetricChars).length > 0)
  );
}

export function setFunbox(funbox: string): boolean {
  loadMemory();
  UpdateConfig.setFunbox(funbox, false);
  UpdateConfig.initFunboxes();
  return true;
}

export function toggleFunbox(
  funbox: string,
  mode: MonkeyTypes.FunboxObjectType | null
): boolean {
  if (
    funbox == "none" ||
    mode === null ||
    (!checkFunbox(funbox) && !Config.funbox.split("#").includes(funbox))
  ) {
    setFunbox("none");
    return true;
  }
  loadMemory();
  const e = UpdateConfig.toggleFunbox(funbox, false);
  UpdateConfig.initFunboxes();
  if (e === false || e === true) return false;
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

  UpdateConfig.initFunboxes();

  $("#funBoxTheme").attr("href", ``);
  $("#words").removeClass("nospace");
  $("#words").removeClass("arrows");
  if ((await Misc.getCurrentLanguage(Config.language)).ligatures) {
    if (UpdateConfig.ActiveFunboxes.find((f) => f.noLingatures)) {
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
    const fb = UpdateConfig.ActiveFunboxes.filter(
      (f) => f.getWord || f.alterText || f.pullSection
    );
    if (fb.length > 0) {
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
    const fb = UpdateConfig.ActiveFunboxes.filter((f) => f.pullSection);
    if (fb.length > 0) {
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
    UpdateConfig.ActiveFunboxes.forEach(async (funbox) => {
      if (funbox.applyCSS) funbox.applyCSS();
      if (funbox.applyConfig) funbox.applyConfig();
    });
  }
  // ModesNotice.update();
  return true;
}

export async function rememberSettings(): Promise<void> {
  UpdateConfig.ActiveFunboxes.forEach(async (funbox) => {
    if (funbox.rememberSettings) funbox.rememberSettings();
  });
}
