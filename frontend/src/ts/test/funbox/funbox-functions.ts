import { Section } from "../../utils/json-data";
import { FunboxWordsFrequency, Wordset } from "../wordset";
import * as GetText from "../../utils/generate";
import Config, * as UpdateConfig from "../../config";
import * as Misc from "../../utils/misc";
import * as Strings from "../../utils/strings";
import { randomIntFromRange } from "@monkeytype/util/numbers";
import * as Arrays from "../../utils/arrays";
import { save } from "./funbox-memory";
import * as TTSEvent from "../../observables/tts-event";
import * as Notifications from "../../elements/notifications";
import * as DDR from "../../utils/ddr";
import * as TestWords from "../test-words";
import * as TestInput from "../test-input";
import * as LayoutfluidFunboxTimer from "./layoutfluid-funbox-timer";
import * as KeymapEvent from "../../observables/keymap-event";
import * as MemoryTimer from "./memory-funbox-timer";
import { getPoem } from "../poetry";
import * as JSONData from "../../utils/json-data";
import { getSection } from "../wikipedia";
import * as WeakSpot from "../weak-spot";
import * as IPAddresses from "../../utils/ip-addresses";
import * as TestState from "../test-state";
import { WordGenError } from "../../utils/word-gen-error";
import {
  FunboxName,
  KeymapLayout,
  Layout,
} from "@monkeytype/contracts/schemas/configs";
import { Language } from "@monkeytype/contracts/schemas/languages";
export type FunboxFunctions = {
  getWord?: (wordset?: Wordset, wordIndex?: number) => string;
  punctuateWord?: (word: string) => string;
  withWords?: (words?: string[]) => Promise<Wordset>;
  alterText?: (word: string, wordIndex: number, wordsBound: number) => string;
  applyConfig?: () => void;
  applyGlobalCSS?: () => void;
  clearGlobal?: () => void;
  rememberSettings?: () => void;
  toggleScript?: (params: string[]) => void;
  pullSection?: (language?: Language) => Promise<Section | false>;
  handleSpace?: () => void;
  handleChar?: (char: string) => string;
  isCharCorrect?: (char: string, originalChar: string) => boolean;
  preventDefaultEvent?: (
    event: JQuery.KeyDownEvent<Document, null, Document, Document>
  ) => Promise<boolean>;
  handleKeydown?: (
    event: JQuery.KeyDownEvent<Document, undefined, Document, Document>
  ) => Promise<void>;
  getResultContent?: () => string;
  start?: () => void;
  restart?: () => void;
  getWordHtml?: (char: string, letterTag?: boolean) => string;
  getWordsFrequencyMode?: () => FunboxWordsFrequency;
};

async function readAheadHandleKeydown(
  event: JQuery.KeyDownEvent<Document, undefined, Document, Document>
): Promise<void> {
  const inputCurrentChar = (TestInput.input.current ?? "").slice(-1);
  const wordCurrentChar = TestWords.words
    .getCurrent()
    .slice(TestInput.input.current.length - 1, TestInput.input.current.length);
  const isCorrect = inputCurrentChar === wordCurrentChar;

  if (
    event.key === "Backspace" &&
    !isCorrect &&
    (TestInput.input.current !== "" ||
      TestInput.input.getHistory(TestState.activeWordIndex - 1) !==
        TestWords.words.get(TestState.activeWordIndex - 1) ||
      Config.freedomMode)
  ) {
    $("#words").addClass("read_ahead_disabled");
  } else if (event.key === " ") {
    $("#words").removeClass("read_ahead_disabled");
  }
}

//todo move to its own file
class CharDistribution {
  public chars: Record<string, number>;
  public count: number;
  constructor() {
    this.chars = {};
    this.count = 0;
  }

  public addChar(char: string): void {
    this.count++;
    if (char in this.chars) {
      (this.chars[char] as number)++;
    } else {
      this.chars[char] = 1;
    }
  }

  public randomChar(): string {
    const randomIndex = randomIntFromRange(0, this.count - 1);
    let runningCount = 0;
    for (const [char, charCount] of Object.entries(this.chars)) {
      runningCount += charCount;
      if (runningCount > randomIndex) {
        return char;
      }
    }

    return Object.keys(this.chars)[0] as string;
  }
}
const prefixSize = 2;
class PseudolangWordGenerator extends Wordset {
  public ngrams: Record<string, CharDistribution> = {};
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
        (this.ngrams[prefix] as CharDistribution).addChar(c);
        prefix = (prefix + c).slice(-prefixSize);
      }
    }
  }

  public override randomWord(): string {
    let word = "";
    for (;;) {
      const prefix = word.slice(-prefixSize);
      const charDistribution = this.ngrams[prefix];
      if (!charDistribution) {
        // This shouldn't happen if this.ngrams is complete. If it does
        // somehow, start generating a new word.
        word = "";
        continue;
      }
      // Pick a random char from the distribution that comes after `prefix`.
      const nextChar = charDistribution.randomChar();
      if (nextChar === " ") {
        // A space marks the end of the word, so stop generating and return.
        break;
      }
      word += nextChar;
    }
    return word;
  }
}

const list: Partial<Record<FunboxName, FunboxFunctions>> = {
  "58008": {
    getWord(): string {
      let num = GetText.getNumbers(7);
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
          word = Strings.replaceCharAt(
            word,
            randomIntFromRange(1, word.length - 2),
            "."
          );
        }
        if (Math.random() < 0.75) {
          const index = randomIntFromRange(1, word.length - 2);
          if (
            word[index - 1] !== "." &&
            word[index + 1] !== "." &&
            word[index + 1] !== "0"
          ) {
            const special = Arrays.randomElementFromArray(["/", "*", "-", "+"]);
            word = Strings.replaceCharAt(word, index, special);
          }
        }
      }
      return word;
    },
    rememberSettings(): void {
      save("numbers", Config.numbers, UpdateConfig.setNumbers);
    },
    handleChar(char: string): string {
      if (char === "\n") {
        return " ";
      }
      return char;
    },
  },
  simon_says: {
    applyConfig(): void {
      UpdateConfig.setKeymapMode("next", true);
    },
    rememberSettings(): void {
      save("keymapMode", Config.keymapMode, UpdateConfig.setKeymapMode);
    },
  },
  tts: {
    applyConfig(): void {
      UpdateConfig.setKeymapMode("off", true);
    },
    rememberSettings(): void {
      save("keymapMode", Config.keymapMode, UpdateConfig.setKeymapMode);
    },
    toggleScript(params: string[]): void {
      if (window.speechSynthesis === undefined) {
        Notifications.add("Failed to load text-to-speech script", -1);
        return;
      }
      if (params[0] !== undefined) void TTSEvent.dispatch(params[0]);
    },
  },
  arrows: {
    getWord(_wordset, wordIndex): string {
      return DDR.chart2Word(wordIndex === 0);
    },
    rememberSettings(): void {
      save(
        "highlightMode",
        Config.highlightMode,
        UpdateConfig.setHighlightMode
      );
    },
    handleChar(char: string): string {
      if (char === "a" || char === "ArrowLeft" || char === "j") {
        return "←";
      }
      if (char === "s" || char === "ArrowDown" || char === "k") {
        return "↓";
      }
      if (char === "w" || char === "ArrowUp" || char === "i") {
        return "↑";
      }
      if (char === "d" || char === "ArrowRight" || char === "l") {
        return "→";
      }
      return char;
    },
    isCharCorrect(char: string, originalChar: string): boolean {
      if (
        (char === "a" || char === "ArrowLeft" || char === "j") &&
        originalChar === "←"
      ) {
        return true;
      }
      if (
        (char === "s" || char === "ArrowDown" || char === "k") &&
        originalChar === "↓"
      ) {
        return true;
      }
      if (
        (char === "w" || char === "ArrowUp" || char === "i") &&
        originalChar === "↑"
      ) {
        return true;
      }
      if (
        (char === "d" || char === "ArrowRight" || char === "l") &&
        originalChar === "→"
      ) {
        return true;
      }
      return false;
    },
    async preventDefaultEvent(event: JQuery.KeyDownEvent): Promise<boolean> {
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
  rAnDoMcAsE: {
    alterText(word: string): string {
      let randomcaseword = word[0] as string;
      for (let i = 1; i < word.length; i++) {
        if (
          randomcaseword[i - 1] ===
          (randomcaseword[i - 1] as string).toUpperCase()
        ) {
          randomcaseword += (word[i] as string).toLowerCase();
        } else {
          randomcaseword += (word[i] as string).toUpperCase();
        }
      }
      return randomcaseword;
    },
  },
  backwards: {
    alterText(word: string): string {
      return word.split("").reverse().join("");
    },
  },
  capitals: {
    alterText(word: string): string {
      return Strings.capitalizeFirstLetterOfEachWord(word);
    },
  },
  layout_mirror: {
    applyConfig(): void {
      let layout = Config.layout;
      if (Config.layout === "default") {
        layout = "qwerty";
      }
      UpdateConfig.setLayout(layout, true);
      UpdateConfig.setKeymapLayout("overrideSync", true);
    },
    rememberSettings(): void {
      save("keymapMode", Config.keymapMode, UpdateConfig.setKeymapMode);
      save("layout", Config.layout, UpdateConfig.setLayout);
    },
  },
  layoutfluid: {
    applyConfig(): void {
      const layout = Config.customLayoutfluid[0] ?? "qwerty";

      UpdateConfig.setLayout(layout as Layout, true);
      UpdateConfig.setKeymapLayout(layout as KeymapLayout, true);
    },
    rememberSettings(): void {
      save("keymapMode", Config.keymapMode, UpdateConfig.setKeymapMode);
      save("layout", Config.layout, UpdateConfig.setLayout);
      save("keymapLayout", Config.keymapLayout, UpdateConfig.setKeymapLayout);
    },
    handleSpace(): void {
      if (Config.mode !== "time") {
        const layouts = Config.customLayoutfluid;
        const outOf: number = TestWords.words.length;
        const wordsPerLayout = Math.floor(outOf / layouts.length);
        const index = Math.floor(
          (TestInput.input.getHistory().length + 1) / wordsPerLayout
        );
        const mod =
          wordsPerLayout - ((TestState.activeWordIndex + 1) % wordsPerLayout);

        if (layouts[index] as string) {
          if (mod <= 3 && (layouts[index + 1] as string)) {
            LayoutfluidFunboxTimer.show();
            LayoutfluidFunboxTimer.updateWords(
              mod,
              layouts[index + 1] as string
            );
          } else {
            LayoutfluidFunboxTimer.hide();
          }
          if (mod === wordsPerLayout) {
            UpdateConfig.setLayout(layouts[index] as Layout);
            UpdateConfig.setKeymapLayout(layouts[index] as KeymapLayout);
            if (mod > 3) {
              LayoutfluidFunboxTimer.hide();
            }
          }
        } else {
          LayoutfluidFunboxTimer.hide();
        }
        setTimeout(() => {
          void KeymapEvent.highlight(
            TestWords.words
              .getCurrent()
              .charAt(TestInput.input.current.length)
              .toString()
          );
        }, 1);
      }
    },
    getResultContent(): string {
      return Config.customLayoutfluid.join(" ");
    },
    restart(): void {
      if (this.applyConfig) this.applyConfig();
      setTimeout(() => {
        void KeymapEvent.highlight(
          TestWords.words
            .getCurrent()
            .substring(
              TestInput.input.current.length,
              TestInput.input.current.length + 1
            )
            .toString()
        );
      }, 1);
    },
  },
  gibberish: {
    getWord(): string {
      return GetText.getGibberish();
    },
  },
  ascii: {
    getWord(): string {
      return GetText.getASCII();
    },
  },
  specials: {
    getWord(): string {
      return GetText.getSpecials();
    },
  },
  read_ahead_easy: {
    rememberSettings(): void {
      save(
        "highlightMode",
        Config.highlightMode,
        UpdateConfig.setHighlightMode
      );
    },
    async handleKeydown(event): Promise<void> {
      await readAheadHandleKeydown(event);
    },
  },
  read_ahead: {
    rememberSettings(): void {
      save(
        "highlightMode",
        Config.highlightMode,
        UpdateConfig.setHighlightMode
      );
    },
    async handleKeydown(event): Promise<void> {
      await readAheadHandleKeydown(event);
    },
  },
  read_ahead_hard: {
    rememberSettings(): void {
      save(
        "highlightMode",
        Config.highlightMode,
        UpdateConfig.setHighlightMode
      );
    },
    async handleKeydown(event): Promise<void> {
      await readAheadHandleKeydown(event);
    },
  },
  memory: {
    applyConfig(): void {
      $("#wordsWrapper").addClass("hidden");
      UpdateConfig.setShowAllLines(true, true);
      if (Config.keymapMode === "next") {
        UpdateConfig.setKeymapMode("react", true);
      }
    },
    rememberSettings(): void {
      save("mode", Config.mode, UpdateConfig.setMode);
      save("showAllLines", Config.showAllLines, UpdateConfig.setShowAllLines);
      if (Config.keymapMode === "next") {
        save("keymapMode", Config.keymapMode, UpdateConfig.setKeymapMode);
      }
    },
    start(): void {
      MemoryTimer.reset();
      $("#words").addClass("hidden");
    },
    restart(): void {
      MemoryTimer.start(Math.round(Math.pow(TestWords.words.length, 1.2)));
      $("#words").removeClass("hidden");
      if (Config.keymapMode === "next") {
        UpdateConfig.setKeymapMode("react");
      }
    },
  },
  nospace: {
    rememberSettings(): void {
      save(
        "highlightMode",
        Config.highlightMode,
        UpdateConfig.setHighlightMode
      );
    },
  },
  poetry: {
    async pullSection(): Promise<JSONData.Section | false> {
      return getPoem();
    },
  },
  wikipedia: {
    async pullSection(lang?: Language): Promise<JSONData.Section | false> {
      return getSection((lang ?? "") || "english");
    },
  },
  weakspot: {
    getWord(wordset?: Wordset): string {
      if (wordset !== undefined) return WeakSpot.getWord(wordset);
      else return "";
    },
  },
  pseudolang: {
    async withWords(words?: string[]): Promise<Wordset> {
      if (words !== undefined) return new PseudolangWordGenerator(words);
      return new Wordset([]);
    },
  },
  IPv4: {
    getWord(): string {
      return IPAddresses.getRandomIPv4address();
    },
    punctuateWord(word: string): string {
      let w = word;
      if (Math.random() < 0.25) {
        w = IPAddresses.addressToCIDR(word);
      }
      return w;
    },
    rememberSettings(): void {
      save("numbers", Config.numbers, UpdateConfig.setNumbers);
    },
  },
  IPv6: {
    getWord(): string {
      return IPAddresses.getRandomIPv6address();
    },
    punctuateWord(word: string): string {
      let w = word;
      if (Math.random() < 0.25) {
        w = IPAddresses.addressToCIDR(word);
      }
      // Compress
      if (w.includes(":")) {
        w = IPAddresses.compressIpv6(w);
      }
      return w;
    },
    rememberSettings(): void {
      save("numbers", Config.numbers, UpdateConfig.setNumbers);
    },
  },
  binary: {
    getWord(): string {
      return GetText.getBinary();
    },
  },
  hexadecimal: {
    getWord(): string {
      return GetText.getHexadecimal();
    },
    punctuateWord(word: string): string {
      return `0x${word}`;
    },
    rememberSettings(): void {
      save("punctuation", Config.punctuation, UpdateConfig.setPunctuation);
    },
  },
  zipf: {
    getWordsFrequencyMode(): FunboxWordsFrequency {
      return "zipf";
    },
  },
  ddoouubblleedd: {
    alterText(word: string): string {
      return word.replace(/./gu, "$&$&");
    },
  },
  instant_messaging: {
    alterText(word: string): string {
      return word
        .toLowerCase()
        .replace(/[.!?]$/g, "\n") //replace .?! with enter
        .replace(/[().'"]/g, "") //remove special characters
        .replace(/\n+/g, "\n"); //make sure there is only one enter
    },
  },
  morse: {
    alterText(word: string): string {
      return GetText.getMorse(word);
    },
  },
  underscore_spaces: {
    alterText(word: string, wordIndex: number, limit: number): string {
      if (wordIndex === limit - 1) return word; // don't add underscore to the last word
      return word + "_";
    },
  },
  crt: {
    applyGlobalCSS(): void {
      const isSafari = /^((?!chrome|android).)*safari/i.test(
        navigator.userAgent
      );
      if (isSafari) {
        //Workaround for bug https://bugs.webkit.org/show_bug.cgi?id=256171 in Safari 16.5 or earlier
        const versionMatch = navigator.userAgent.match(
          /.*Version\/([0-9]*)\.([0-9]*).*/
        );
        const mainVersion =
          versionMatch !== null ? parseInt(versionMatch[1] ?? "0") : 0;
        const minorVersion =
          versionMatch !== null ? parseInt(versionMatch[2] ?? "0") : 0;
        if (mainVersion <= 16 && minorVersion <= 5) {
          Notifications.add(
            "CRT is not available on Safari 16.5 or earlier.",
            0,
            {
              duration: 5,
            }
          );
          UpdateConfig.toggleFunbox("crt");
          return;
        }
      }
      $("body").append('<div id="scanline" />');
      $("body").addClass("crtmode");
      $("#globalFunBoxTheme").attr("href", `funbox/crt.css`);
    },
    clearGlobal(): void {
      $("#scanline").remove();
      $("body").removeClass("crtmode");
      $("#globalFunBoxTheme").attr("href", ``);
    },
  },
  ALL_CAPS: {
    alterText(word: string): string {
      return word.toUpperCase();
    },
  },
  polyglot: {
    async withWords(_words) {
      const promises = Config.customPolyglot.map(async (language) =>
        JSONData.getLanguage(language).catch(() => {
          Notifications.add(
            `Failed to load language: ${language}. It will be ignored.`,
            0
          );
          return null; // Return null for failed languages
        })
      );

      const languages = (await Promise.all(promises)).filter(
        (lang) => lang !== null
      );

      if (languages.length === 0) {
        UpdateConfig.toggleFunbox("polyglot");
        throw new Error(
          `No valid languages found. Please check your polyglot languages config (${Config.customPolyglot.join(
            ", "
          )}).`
        );
      }

      if (languages.length === 1) {
        const lang = languages[0] as JSONData.LanguageObject;
        UpdateConfig.setLanguage(lang.name, true);
        UpdateConfig.toggleFunbox("polyglot", true);
        Notifications.add(
          `Disabled polyglot funbox because only one valid language was found. Check your polyglot languages config (${Config.customPolyglot.join(
            ", "
          )}).`,
          0,
          {
            duration: 7,
          }
        );
        throw new WordGenError("");
      }

      const wordSet = languages.flatMap((it) => it.words);
      Arrays.shuffle(wordSet);
      return new Wordset(wordSet);
    },
  },
};

export function getFunboxFunctions(): Record<FunboxName, FunboxFunctions> {
  return list as Record<FunboxName, FunboxFunctions>;
}
