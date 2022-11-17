// import * as WeakSpot from "../weak-spot";
// import { getPoem } from "../poetry";
// import { getSection } from "../wikipedia";
// import * as Notifications from "../../elements/notifications";
// import * as MemoryTimer from "./memory-funbox-timer";

const list: MonkeyTypes.FunboxObject[] = [
  {
    name: "nausea",
    info: "I think I'm gonna be sick.",
  },
  {
    name: "round_round_baby",
    info: "...right round, like a record baby. Right, round round round.",
  },
  {
    name: "simon_says",
    info: "Type what simon says.",
    properties: ["changesWordsVisibility", "usesLayout"],
    forcedConfig: {
      highlightMode: ["letter", "off"],
    },
  },
  {
    name: "mirror",
    info: "Everything is mirrored!",
  },
  {
    name: "tts",
    info: "Listen closely.",
    properties: ["changesWordsVisibility", "speaks"],
    forcedConfig: {
      highlightMode: ["letter", "off"],
    },
  },
  {
    name: "choo_choo",
    info: "All the letters are spinning!",
    properties: ["noLigatures", "conflictsWithSymmetricChars"],
  },
  {
    name: "arrows",
    info: "Eurobeat Intensifies...",
    properties: [
      "ignoresLanguage",
      "ignoresLayout",
      "nospace",
      "noLetters",
      "symmetricChars",
    ],
    forcedConfig: {
      punctuation: [false],
      numbers: [false],
      highlightMode: ["letter", "off"],
    },
  },
  {
    name: "rAnDoMcAsE",
    info: "I kInDa LiKe HoW iNeFfIcIeNt QwErTy Is.",
    properties: ["changesCapitalisation"],
  },
  {
    name: "capitals",
    info: "Capitalize Every Word.",
    properties: ["changesCapitalisation"],
  },
  {
    name: "layoutfluid",
    info: "Switch between layouts specified below proportionately to the length of the test.",
    properties: ["changesLayout", "noInfiniteDuration"],
  },
  {
    name: "earthquake",
    info: "Everybody get down! The words are shaking!",
    properties: ["noLigatures"],
  },
  {
    name: "space_balls",
    info: "In a galaxy far far away.",
  },
  {
    name: "gibberish",
    info: "Anvbuefl dizzs eoos alsb?",
    properties: ["ignoresLanguage", "unspeakable"],
  },
  // {
  //   name: "58008",
  //   alias: "numbers",
  //   info: "A special mode for accountants.",
  //   properties: ["ignoresLanguage", "ignoresLayout", "noLetters"],
  //   forcedConfig: {
  //     numbers: [false],
  //   },
  //   functions: {
  //     getWord(): string {
  //       let num = Misc.getNumbers(7);
  //       if (Config.language.startsWith("kurdish")) {
  //         num = Misc.convertNumberToArabic(num);
  //       } else if (Config.language.startsWith("nepali")) {
  //         num = Misc.convertNumberToNepali(num);
  //       }
  //       return num;
  //     },
  //     punctuateWord(word: string): string {
  //       if (word.length > 3) {
  //         if (Math.random() < 0.5) {
  //           word = Misc.setCharAt(
  //             word,
  //             Misc.randomIntFromRange(1, word.length - 2),
  //             "."
  //           );
  //         }
  //         if (Math.random() < 0.75) {
  //           const index = Misc.randomIntFromRange(1, word.length - 2);
  //           if (
  //             word[index - 1] !== "." &&
  //             word[index + 1] !== "." &&
  //             word[index + 1] !== "0"
  //           ) {
  //             const special = Misc.randomElementFromArray(["/", "*", "-", "+"]);
  //             word = Misc.setCharAt(word, index, special);
  //           }
  //         }
  //       }
  //       return word;
  //     },
  //     rememberSettings(): void {
  //       save("numbers", Config.numbers, UpdateConfig.setNumbers);
  //     },
  //     handleChar(char: string): string {
  //       if (char === "\n") {
  //         return " ";
  //       }
  //       return char;
  //     },
  //   },
  // },
  // {
  //   name: "ascii",
  //   info: "Where was the ampersand again?. Only ASCII characters.",
  //   properties: ["ignoresLanguage", "noLetters", "unspeakable"],
  //   forcedConfig: {
  //     punctuation: [false],
  //     numbers: [false],
  //   },
  //   functions: {
  //     getWord(): string {
  //       return Misc.getASCII();
  //     },
  //   },
  // },
  // {
  //   name: "specials",
  //   info: "!@#$%^&*. Only special characters.",
  //   properties: ["ignoresLanguage", "noLetters", "unspeakable"],
  //   forcedConfig: {
  //     punctuation: [false],
  //     numbers: [false],
  //   },
  //   functions: {
  //     getWord(): string {
  //       return Misc.getSpecials();
  //     },
  //   },
  // },
  // {
  //   name: "plus_one",
  //   info: "React quickly! Only one future word is visible.",
  //   properties: ["changesWordsVisibility", "toPush:2", "noInfiniteDuration"],
  // },
  // {
  //   name: "plus_two",
  //   info: "Only two future words are visible.",
  //   properties: ["changesWordsVisibility", "toPush:3", "noInfiniteDuration"],
  // },
  // {
  //   name: "read_ahead_easy",
  //   info: "Only the current word is invisible.",
  //   properties: ["changesWordsVisibility"],
  //   forcedConfig: {
  //     highlightMode: ["letter", "off"],
  //   },
  //   functions: {
  //     applyCSS(): void {
  //       $("#funBoxTheme").attr("href", `funbox/read_ahead_easy.css`);
  //     },
  //     rememberSettings(): void {
  //       save(
  //         "highlightMode",
  //         Config.highlightMode,
  //         UpdateConfig.setHighlightMode
  //       );
  //     },
  //   },
  // },
  // {
  //   name: "read_ahead",
  //   info: "Current and the next word are invisible!",
  //   properties: ["changesWordsVisibility"],
  //   forcedConfig: {
  //     highlightMode: ["letter", "off"],
  //   },
  //   functions: {
  //     applyCSS(): void {
  //       $("#funBoxTheme").attr("href", `funbox/read_ahead.css`);
  //     },
  //     rememberSettings(): void {
  //       save(
  //         "highlightMode",
  //         Config.highlightMode,
  //         UpdateConfig.setHighlightMode
  //       );
  //     },
  //   },
  // },
  // {
  //   name: "read_ahead_hard",
  //   info: "Current and the next two words are invisible!",
  //   properties: ["changesWordsVisibility"],
  //   forcedConfig: {
  //     highlightMode: ["letter", "off"],
  //   },
  //   functions: {
  //     applyCSS(): void {
  //       $("#funBoxTheme").attr("href", `funbox/read_ahead_hard.css`);
  //     },
  //     rememberSettings(): void {
  //       save(
  //         "highlightMode",
  //         Config.highlightMode,
  //         UpdateConfig.setHighlightMode
  //       );
  //     },
  //   },
  // },
  // {
  //   name: "memory",
  //   info: "Test your memory. Remember the words and type them blind.",
  //   mode: ["words", "quote", "custom"],
  //   properties: ["changesWordsVisibility", "noInfiniteDuration"],
  //   functions: {
  //     applyConfig(): void {
  //       $("#wordsWrapper").addClass("hidden");
  //       UpdateConfig.setShowAllLines(true, true);
  //       if (Config.keymapMode === "next") {
  //         UpdateConfig.setKeymapMode("react", true);
  //       }
  //     },
  //     rememberSettings(): void {
  //       save("mode", Config.mode, UpdateConfig.setMode);
  //       save("showAllLines", Config.showAllLines, UpdateConfig.setShowAllLines);
  //       if (Config.keymapMode === "next") {
  //         save("keymapMode", Config.keymapMode, UpdateConfig.setKeymapMode);
  //       }
  //     },
  //     start(): void {
  //       MemoryTimer.reset();
  //       $("#wordsWrapper").addClass("hidden");
  //     },
  //     restart(): void {
  //       MemoryTimer.start();
  //       if (Config.keymapMode === "next") {
  //         UpdateConfig.setKeymapMode("react");
  //       }
  //     },
  //   },
  // },
  // {
  //   name: "nospace",
  //   info: "Whoneedsspacesanyway?",
  //   properties: ["nospace"],
  //   forcedConfig: {
  //     highlightMode: ["letter", "off"],
  //   },
  //   functions: {
  //     applyConfig(): void {
  //       $("#words").addClass("nospace");
  //     },
  //     rememberSettings(): void {
  //       save(
  //         "highlightMode",
  //         Config.highlightMode,
  //         UpdateConfig.setHighlightMode
  //       );
  //     },
  //   },
  // },
  // {
  //   name: "poetry",
  //   info: "Practice typing some beautiful prose.",
  //   properties: ["noInfiniteDuration"],
  //   forcedConfig: {
  //     punctuation: [false],
  //     numbers: [false],
  //   },
  //   functions: {
  //     async pullSection(): Promise<Misc.Section | false> {
  //       return getPoem();
  //     },
  //   },
  // },
  // {
  //   name: "wikipedia",
  //   info: "Practice typing wikipedia sections.",
  //   properties: ["noInfiniteDuration"],
  //   forcedConfig: {
  //     punctuation: [false],
  //     numbers: [false],
  //   },
  //   functions: {
  //     async pullSection(lang?: string): Promise<Misc.Section | false> {
  //       return getSection(lang ? lang : "english");
  //     },
  //   },
  // },
  // {
  //   name: "weakspot",
  //   info: "Focus on slow and mistyped letters.",
  //   functions: {
  //     getWord(wordset?: Misc.Wordset): string {
  //       if (wordset !== undefined) return WeakSpot.getWord(wordset);
  //       else return "";
  //     },
  //   },
  // },
  {
    name: "pseudolang",
    info: "Nonsense words that look like the current language.",
    properties: ["unspeakable"],
  },
];

export function getAll(): MonkeyTypes.FunboxObject[] {
  return list;
}

export function get(config: string): MonkeyTypes.FunboxObject[] {
  const funboxes: MonkeyTypes.FunboxObject[] = [];
  for (const i of config.split("#")) {
    const f = list.find((f) => f.name === i);
    if (f) funboxes.push(f);
  }
  return funboxes;
}

export function setFunboxFunctions(
  name: string,
  obj: MonkeyTypes.FunboxFunctions
): void {
  const fb = list.find((f) => f.name === name);
  if (!fb) throw new Error(`Funbox ${name} not found.`);
  fb.functions = obj;
}
