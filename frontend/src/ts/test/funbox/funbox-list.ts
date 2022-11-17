import * as Misc from "../../utils/misc";
import * as TestInput from "../test-input";
import * as WeakSpot from "../weak-spot";
import { getPoem } from "../poetry";
import { getSection } from "../wikipedia";
import * as Notifications from "../../elements/notifications";
import * as TestWords from "../test-words";
import * as MemoryTimer from "./memory-funbox-timer";
import * as KeymapEvent from "../../observables/keymap-event";

const prefixSize = 2;

class CharDistribution {
  public chars: { [char: string]: number };
  public count: number;
  constructor() {
    this.chars = {};
    this.count = 0;
  }

  public addChar(char: string): void {
    this.count++;
    if (char in this.chars) {
      this.chars[char]++;
    } else {
      this.chars[char] = 1;
    }
  }

  public randomChar(): string {
    const randomIndex = Misc.randomIntFromRange(0, this.count - 1);
    let runningCount = 0;
    for (const [char, charCount] of Object.entries(this.chars)) {
      runningCount += charCount;
      if (runningCount > randomIndex) {
        return char;
      }
    }

    return Object.keys(this.chars)[0];
  }
}

class PseudolangWordGenerator extends Misc.Wordset {
  public ngrams: { [prefix: string]: CharDistribution } = {};
  constructor(words: string[]) {
    super(words);
    // Can generate an unbounded number of words in theory.
    this.length = Infinity;

    for (let word of words) {
      // Mark the end of each word with a space.
      word += " ";
      let prefix = "";
      for (const c of word) {
        // Add `c` to the distribution of chars that can come after `prefix`.
        if (!(prefix in this.ngrams)) {
          this.ngrams[prefix] = new CharDistribution();
        }
        this.ngrams[prefix].addChar(c);
        prefix = (prefix + c).substr(-prefixSize);
      }
    }
  }

  public override randomWord(): string {
    let word = "";
    for (;;) {
      const prefix = word.substr(-prefixSize);
      const charDistribution = this.ngrams[prefix];
      if (!charDistribution) {
        // This shouldn't happen if this.ngrams is complete. If it does
        // somehow, start generating a new word.
        word = "";
        continue;
      }
      // Pick a random char from the distribution that comes after `prefix`.
      const nextChar = charDistribution.randomChar();
      if (nextChar == " ") {
        // A space marks the end of the word, so stop generating and return.
        break;
      }
      word += nextChar;
    }
    return word;
  }
}

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
  // {
  //   name: "rAnDoMcAsE",
  //   info: "I kInDa LiKe HoW iNeFfIcIeNt QwErTy Is.",
  //   properties: ["changesCapitalisation"],
  //   functions: {
  //     alterText(word: string): string {
  //       let randomcaseword = word[0];
  //       for (let i = 1; i < word.length; i++) {
  //         if (randomcaseword[i - 1] == randomcaseword[i - 1].toUpperCase()) {
  //           randomcaseword += word[i].toLowerCase();
  //         } else {
  //           randomcaseword += word[i].toUpperCase();
  //         }
  //       }
  //       return randomcaseword;
  //     },
  //   },
  // },
  // {
  //   name: "capitals",
  //   info: "Capitalize Every Word.",
  //   properties: ["changesCapitalisation"],
  //   functions: {
  //     alterText(word: string): string {
  //       return Misc.capitalizeFirstLetterOfEachWord(word);
  //     },
  //   },
  // },
  // {
  //   name: "layoutfluid",
  //   info: "Switch between layouts specified below proportionately to the length of the test.",
  //   properties: ["changesLayout", "noInfiniteDuration"],
  //   functions: {
  //     applyConfig(): void {
  //       UpdateConfig.setLayout(
  //         Config.customLayoutfluid.split("#")[0]
  //           ? Config.customLayoutfluid.split("#")[0]
  //           : "qwerty",
  //         true
  //       );
  //       UpdateConfig.setKeymapLayout(
  //         Config.customLayoutfluid.split("#")[0]
  //           ? Config.customLayoutfluid.split("#")[0]
  //           : "qwerty",
  //         true
  //       );
  //     },
  //     rememberSettings(): void {
  //       save("keymapMode", Config.keymapMode, UpdateConfig.setKeymapMode);
  //       save("layout", Config.layout, UpdateConfig.setLayout);
  //       save("keymapLayout", Config.keymapLayout, UpdateConfig.setKeymapLayout);
  //     },
  //     handleSpace(): void {
  //       if (Config.mode !== "time") {
  //         // here I need to check if Config.customLayoutFluid exists because of my
  //         // scuffed solution of returning whenever value is undefined in the setCustomLayoutfluid function
  //         const layouts: string[] = Config.customLayoutfluid
  //           ? Config.customLayoutfluid.split("#")
  //           : ["qwerty", "dvorak", "colemak"];
  //         let index = 0;
  //         const outOf: number = TestWords.words.length;
  //         index = Math.floor(
  //           (TestInput.input.history.length + 1) / (outOf / layouts.length)
  //         );
  //         if (
  //           Config.layout !== layouts[index] &&
  //           layouts[index] !== undefined
  //         ) {
  //           Notifications.add(`--- !!! ${layouts[index]} !!! ---`, 0);
  //         }
  //         if (layouts[index]) {
  //           UpdateConfig.setLayout(layouts[index]);
  //           UpdateConfig.setKeymapLayout(layouts[index]);
  //         }
  //         KeymapEvent.highlight(
  //           TestWords.words
  //             .getCurrent()
  //             .charAt(TestInput.input.current.length)
  //             .toString()
  //         );
  //       }
  //     },
  //     getResultContent(): string {
  //       return Config.customLayoutfluid.replace(/#/g, " ");
  //     },
  //     restart(): void {
  //       if (this.applyConfig) this.applyConfig();
  //       KeymapEvent.highlight(
  //         TestWords.words
  //           .getCurrent()
  //           .substring(
  //             TestInput.input.current.length,
  //             TestInput.input.current.length + 1
  //           )
  //           .toString()
  //       );
  //     },
  //   },
  // },
  // {
  //   name: "earthquake",
  //   info: "Everybody get down! The words are shaking!",
  //   properties: ["noLigatures"],
  //   functions: {
  //     applyCSS(): void {
  //       $("#funBoxTheme").attr("href", `funbox/earthquake.css`);
  //     },
  //   },
  // },
  // {
  //   name: "space_balls",
  //   info: "In a galaxy far far away.",
  //   functions: {
  //     applyCSS(): void {
  //       $("#funBoxTheme").attr("href", `funbox/space_balls.css`);
  //     },
  //   },
  // },
  // {
  //   name: "gibberish",
  //   info: "Anvbuefl dizzs eoos alsb?",
  //   properties: ["ignoresLanguage", "unspeakable"],
  //   functions: {
  //     getWord(): string {
  //       return Misc.getGibberish();
  //     },
  //   },
  // },
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
  // {
  //   name: "pseudolang",
  //   info: "Nonsense words that look like the current language.",
  //   properties: ["unspeakable"],
  //   functions: {
  //     async withWords(words?: string[]): Promise<Misc.Wordset> {
  //       if (words !== undefined) return new PseudolangWordGenerator(words);
  //       return new Misc.Wordset([]);
  //     },
  //   },
  // },
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
