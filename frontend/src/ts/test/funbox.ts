import * as TestWords from "./test-words";
import * as Notifications from "../elements/notifications";
import * as Misc from "../utils/misc";
import * as ManualRestart from "./manual-restart-tracker";
import Config, * as UpdateConfig from "../config";
import * as TestInput from "../test/test-input";
import * as Keymap from "../elements/keymap";
import * as TTS from "./tts";
import * as WeakSpot from "./weak-spot";
import { getPoem } from "./poetry";
import { getSection } from "./wikipedia";

export const Funboxes: MonkeyTypes.FunboxObject[] = [
  {
    name: "nausea",
    info: "I think I'm gonna be sick.",
    applyCSS(): void {
      $("#funBoxTheme").attr("href", `funbox/nausea.css`);
    },
  },
  {
    name: "round_round_baby",
    info: "...right round, like a record baby. Right, round round round.",
    applyCSS(): void {
      $("#funBoxTheme").attr("href", `funbox/round_round_baby.css`);
    },
  },
  {
    name: "simon_says",
    info: "Type what simon says.",
    changesWordsVisibility: true,
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
    info: "Everything is mirrored!",
    applyCSS(): void {
      $("#funBoxTheme").attr("href", `funbox/mirror.css`);
    },
  },
  {
    name: "tts",
    info: "Listen closely.",
    blockWordHighlight: true,
    changesWordsVisibility: true,
    speaks: true,
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
      if (window.speechSynthesis == undefined) {
        Notifications.add("Failed to load text-to-speech script", -1);
        return;
      }
      TTS.speak(params[0]);
    },
  },
  {
    name: "choo_choo",
    info: "All the letters are spinning!",
    noLigatures: true,
    conflictsWithSymmetricChars: true,
    applyCSS(): void {
      $("#funBoxTheme").attr("href", `funbox/choo_choo.css`);
    },
  },
  {
    name: "arrows",
    info: "Eurobeat Intensifies...",
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
    handleChar(char: string): string {
      if (char === Config.arrowKeys[0] || char === "ArrowLeft") {
        return "←";
      }
      if (char === Config.arrowKeys[1] || char === "ArrowDown") {
        return "↓";
      }
      if (char === Config.arrowKeys[2] || char === "ArrowUp") {
        return "↑";
      }
      if (char === Config.arrowKeys[3] || char === "ArrowRight") {
        return "→";
      }
      return char;
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
    getWordHtml(char: string, letterTag?: boolean): string {
      let retval = "";
      if (char === "↑") {
        if (letterTag) retval += `<letter>`;
        retval += `<i class="fas fa-arrow-up"></i>`;
        if (letterTag) retval += `</letter>`;
      }
      if (char === "↓") {
        if (letterTag) retval += `<letter>`;
        retval += `<i class="fas fa-arrow-down"></i>`;
        if (letterTag) retval += `</letter>`;
      }
      if (char === "←") {
        if (letterTag) retval += `<letter>`;
        retval += `<i class="fas fa-arrow-left"></i>`;
        if (letterTag) retval += `</letter>`;
      }
      if (char === "→") {
        if (letterTag) retval += `<letter>`;
        retval += `<i class="fas fa-arrow-right"></i>`;
        if (letterTag) retval += `</letter>`;
      }
      return retval;
    },
  },
  {
    name: "rAnDoMcAsE",
    info: "I kInDa LiKe HoW iNeFfIcIeNt QwErTy Is.",
    changesCapitalisation: true,
    alterText(word: string): string {
      let randomcaseword = word[0];
      for (let i = 1; i < word.length; i++) {
        if (randomcaseword[i - 1] == randomcaseword[i - 1].toUpperCase()) {
          randomcaseword += word[i].toLowerCase();
        } else {
          randomcaseword += word[i].toUpperCase();
        }
      }
      return randomcaseword;
    },
  },
  {
    name: "capitals",
    info: "Capitalize Every Word.",
    changesCapitalisation: true,
    alterText(word: string): string {
      return Misc.capitalizeFirstLetterOfEachWord(word);
    },
  },
  {
    name: "layoutfluid",
    info: "Switch between layouts specified below proportionately to the length of the test.",
    changesLayout: true,
    applyConfig(): void {
      UpdateConfig.setLayout(
        Config.customLayoutfluid.split("#")[0]
          ? Config.customLayoutfluid.split("#")[0]
          : "qwerty",
        true
      );
      UpdateConfig.setKeymapLayout(
        Config.customLayoutfluid.split("#")[0]
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
        if (layouts[index]) {
          UpdateConfig.setLayout(layouts[index]);
          UpdateConfig.setKeymapLayout(layouts[index]);
        }
        Keymap.highlightKey(
          TestWords.words
            .getCurrent()
            .charAt(TestInput.input.current.length)
            .toString()
        );
      }
    },
    getResultContent(): string {
      return Config.customLayoutfluid.replace(/#/g, " ");
    },
    restart(): void {
      if (this.applyConfig) this.applyConfig();
      Keymap.highlightKey(
        TestWords.words
          .getCurrent()
          .substring(
            TestInput.input.current.length,
            TestInput.input.current.length + 1
          )
          .toString()
      );
    },
  },
  {
    name: "earthquake",
    info: "Everybody get down! The words are shaking!",
    noLigatures: true,
    applyCSS(): void {
      $("#funBoxTheme").attr("href", `funbox/earthquake.css`);
    },
  },
  {
    name: "space_balls",
    info: "In a galaxy far far away.",
    applyCSS(): void {
      $("#funBoxTheme").attr("href", `funbox/space_balls.css`);
    },
  },
  {
    name: "gibberish",
    info: "Anvbuefl dizzs eoos alsb?",
    ignoresLanguage: true,
    unspeakable: true,
    getWord(): string {
      return Misc.getGibberish();
    },
  },
  {
    name: "58008",
    alias: "numbers",
    info: "A special mode for accountants.",
    noNumbers: true,
    ignoresLanguage: true,
    noLetters: true,
    ignoresLayout: true,
    getWord(): string {
      let num = Misc.getNumbers(7);
      if (Config.language.startsWith("kurdish")) {
        num = Misc.convertNumberToArabic(num);
      } else if (Config.language.startsWith("nepali")) {
        num = Misc.convertNumberToNepali(num);
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
    info: "Where was the ampersand again?. Only ASCII characters.",
    ignoresLanguage: true,
    noPunctuation: true,
    noNumbers: true,
    noLetters: true,
    unspeakable: true,
    getWord(): string {
      return Misc.getASCII();
    },
  },
  {
    name: "specials",
    info: "!@#$%^&*. Only special characters.",
    ignoresLanguage: true,
    noPunctuation: true,
    noNumbers: true,
    noLetters: true,
    unspeakable: true,
    getWord(): string {
      return Misc.getSpecials();
    },
  },
  {
    name: "plus_one",
    info: "React quickly! Only one future word is visible.",
    toPushCount: 2,
    changesWordsVisibility: true,
  },
  {
    name: "plus_two",
    info: "Only two future words are visible.",
    toPushCount: 3,
    changesWordsVisibility: true,
  },
  {
    name: "read_ahead_easy",
    info: "Only the current word is invisible.",
    blockWordHighlight: true,
    changesWordsVisibility: true,
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
    info: "Current and the next word are invisible!",
    blockWordHighlight: true,
    changesWordsVisibility: true,
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
    info: "Current and the next two words are invisible!",
    blockWordHighlight: true,
    changesWordsVisibility: true,
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
    info: "Test your memory. Remember the words and type them blind.",
    mode: "words",
    changesWordsVisibility: true,
    applyConfig(): void {
      $("#wordsWrapper").addClass("hidden");
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
    start(): void {
      resetMemoryTimer();
      $("#wordsWrapper").addClass("hidden");
    },
    restart(): void {
      startMemoryTimer();
      if (Config.keymapMode === "next") {
        UpdateConfig.setKeymapMode("react");
      }
    },
  },
  {
    name: "nospace",
    info: "Whoneedsspacesanyway?",
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
    info: "Practice typing some beautiful prose.",
    noPunctuation: true,
    noNumbers: true,
    async pullSection(): Promise<Misc.Section | false> {
      return getPoem();
    },
  },
  {
    name: "wikipedia",
    info: "Practice typing wikipedia sections.",
    noPunctuation: true,
    noNumbers: true,
    async pullSection(lang?: string): Promise<Misc.Section | false> {
      return getSection(lang ? lang : "english");
    },
  },
  {
    name: "weakspot",
    info: "Focus on slow and mistyped letters.",
    getWord(wordset?: Misc.Wordset): string {
      if (wordset !== undefined) return WeakSpot.getWord(wordset);
      else return "";
    },
  },
  {
    name: "pseudolang",
    info: "Nonsense words that look like the current language.",
    unspeakable: true,
    async withWords(words?: string[]): Promise<Misc.Wordset> {
      if (words !== undefined) return new Misc.PseudolangWordGenerator(words);
      return new Misc.Wordset([]);
    },
  },
];

export const ActiveFunboxes = (): MonkeyTypes.FunboxObject[] => {
  const funboxes: MonkeyTypes.FunboxObject[] = [];
  for (const i of Config.funbox.split("#")) {
    const f = Funboxes.find((f) => f.name === i);
    if (f) funboxes.push(f);
  }
  return funboxes;
};

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
  ActiveFunboxes().forEach((funbox) => {
    if (funbox.toggleScript) funbox.toggleScript(params);
  });
}

export function checkFunbox(funbox?: string): boolean {
  if (funbox === "none" || Config.funbox === "none") return true;
  let checkingFunbox = ActiveFunboxes();
  if (funbox !== undefined) {
    checkingFunbox = checkingFunbox.concat(
      Funboxes.filter((f) => f.name == funbox)
    );
  }
  return !(
    Funboxes.filter(
      (f) => Config.funbox.split("#").find((cf) => cf == f.name) !== undefined
    ).length != Config.funbox.split("#").length ||
    checkingFunbox.filter((f) => f.getWord || f.pullSection || f.withWords)
      .length > 1 ||
    checkingFunbox.filter((f) => f.applyCSS).length > 1 ||
    checkingFunbox.filter((f) => f.punctuateWord).length > 1 ||
    checkingFunbox.filter((f) => f.isCharCorrect).length > 1 ||
    checkingFunbox.filter((f) => f.nospace).length > 1 ||
    checkingFunbox.filter((f) => f.toPushCount).length > 1 ||
    checkingFunbox.filter((f) => f.changesWordsVisibility).length > 1 ||
    (checkingFunbox.filter((f) => f.noLetters).length > 0 &&
      checkingFunbox.filter((f) => f.changesCapitalisation).length > 0) ||
    (checkingFunbox.filter((f) => f.conflictsWithSymmetricChars).length > 0 &&
      checkingFunbox.filter((f) => f.symmetricChars).length > 0) ||
    (checkingFunbox.filter((f) => f.toPushCount).length > 0 &&
      checkingFunbox.filter((f) => f.pullSection).length > 0) ||
    (checkingFunbox.filter((f) => f.speaks).length > 0 &&
      checkingFunbox.filter((f) => f.unspeakable).length > 0) ||
    (checkingFunbox.filter((f) => f.speaks).length > 0 &&
      checkingFunbox.filter((f) => f.ignoresLanguage).length > 0) ||
    (checkingFunbox.filter((f) => f.changesLayout).length > 0 &&
      checkingFunbox.filter((f) => f.ignoresLayout).length > 0)
  );
}

export function setFunbox(funbox: string): boolean {
  loadMemory();
  UpdateConfig.setFunbox(funbox, false);
  return true;
}

export function toggleFunbox(funbox: string): boolean {
  if (
    funbox == "none" ||
    (!checkFunbox(funbox) && !Config.funbox.split("#").includes(funbox))
  ) {
    setFunbox("none");
    return true;
  }
  loadMemory();
  const e = UpdateConfig.toggleFunbox(funbox, false);
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
  return true;
}

export async function activate(funbox?: string): Promise<boolean | undefined> {
  if (funbox === undefined || funbox === null) {
    funbox = Config.funbox;
  } else if (Config.funbox != funbox) {
    Config.funbox = funbox;
  }

  // The configuration might be edited with dev tools,
  // so we need to double check its validity
  if (!checkFunbox()) {
    funbox = "none";
    setFunbox(funbox);
  }

  // if (funbox === "none") {
  reset();
  $("#wordsWrapper").removeClass("hidden");
  // }

  $("#funBoxTheme").attr("href", ``);
  $("#words").removeClass("nospace");
  $("#words").removeClass("arrows");
  if ((await Misc.getCurrentLanguage(Config.language)).ligatures) {
    if (ActiveFunboxes().find((f) => f.noLigatures)) {
      Notifications.add(
        "Current language does not support this funbox mode",
        0
      );
      UpdateConfig.setFunbox("none", true);
      await clear();
      return;
    }
  }

  let fb: MonkeyTypes.FunboxObject[] = [];
  if (Config.mode === "zen") {
    fb = fb.concat(
      ActiveFunboxes().filter(
        (f) =>
          f.getWord ||
          f.pullSection ||
          f.alterText ||
          f.withWords ||
          f.changesCapitalisation ||
          f.nospace ||
          f.toPushCount ||
          f.changesWordsVisibility ||
          f.speaks ||
          f.changesLayout
      )
    );
  }
  if (Config.mode === "quote") {
    fb = fb.concat(
      ActiveFunboxes().filter((f) => f.getWord || f.pullSection || f.withWords)
    );
  }
  if (fb.length > 0) {
    Notifications.add(
      `${Misc.capitalizeFirstLetterOfEachWord(
        Config.mode
      )} mode does not support the ${fb[0].name.replace(/_/g, " ")} funbox`,
      0
    );
    UpdateConfig.setMode("time", true);
  }

  if (
    (Config.time === 0 && Config.mode === "time") ||
    (Config.words === 0 && Config.mode === "words")
  ) {
    const fb = ActiveFunboxes().filter((f) => f.pullSection || f.toPushCount);
    if (fb.length > 0) {
      Notifications.add(
        `${Misc.capitalizeFirstLetterOfEachWord(
          Config.mode
        )} mode with value 0 does not support the ${fb[0].name.replace(
          /_/g,
          " "
        )} funbox`,
        0
      );
      if (Config.mode === "time") UpdateConfig.setTimeConfig(15, true);
      if (Config.mode === "words") UpdateConfig.setWordCount(10, true);
    }
  }

  ManualRestart.set();
  ActiveFunboxes().forEach(async (funbox) => {
    if (funbox.applyCSS) funbox.applyCSS();
    if (funbox.applyConfig) funbox.applyConfig();
  });
  // ModesNotice.update();
  return true;
}

export async function rememberSettings(): Promise<void> {
  ActiveFunboxes().forEach(async (funbox) => {
    if (funbox.rememberSettings) funbox.rememberSettings();
  });
}
