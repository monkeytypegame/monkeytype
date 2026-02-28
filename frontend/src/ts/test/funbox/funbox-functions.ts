import { FunboxWordsFrequency, Wordset } from "../wordset";
import * as GetText from "../../utils/generate";
import Config, { setConfig, toggleFunbox } from "../../config";
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
import { FunboxName, KeymapLayout, Layout } from "@monkeytype/schemas/configs";
import { Language, LanguageObject } from "@monkeytype/schemas/languages";
import { qs } from "../../utils/dom";

export type FunboxFunctions = {
  getWord?: (wordset?: Wordset, wordIndex?: number) => string;
  punctuateWord?: (word: string) => string;
  withWords?: (words?: string[]) => Promise<Wordset | PolyglotWordset>;
  alterText?: (word: string, wordIndex: number, wordsBound: number) => string;
  applyConfig?: () => void;
  applyGlobalCSS?: () => void;
  clearGlobal?: () => void;
  rememberSettings?: () => void;
  toggleScript?: (params: string[]) => void;
  pullSection?: (language?: Language) => Promise<JSONData.Section | false>;
  handleSpace?: () => void;
  getEmulatedChar?: (event: KeyboardEvent) => string | null;
  isCharCorrect?: (char: string, originalChar: string) => boolean;
  handleKeydown?: (event: KeyboardEvent) => Promise<void>;
  getResultContent?: () => string;
  start?: () => void;
  restart?: () => void;
  getWordHtml?: (char: string, letterTag?: boolean) => string;
  getWordsFrequencyMode?: () => FunboxWordsFrequency;
};

async function readAheadHandleKeydown(event: KeyboardEvent): Promise<void> {
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
    qs("#words")?.addClass("read_ahead_disabled");
  } else if (event.key === " ") {
    qs("#words")?.removeClass("read_ahead_disabled");
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

export class PolyglotWordset extends Wordset {
  public wordsWithLanguage: Map<string, Language>;
  public languageProperties: Map<Language, JSONData.LanguageProperties>;

  constructor(
    wordsWithLanguage: Map<string, Language>,
    languageProperties: Map<Language, JSONData.LanguageProperties>,
  ) {
    // build and shuffle the word array
    const wordArray = Array.from(wordsWithLanguage.keys());
    Arrays.shuffle(wordArray);
    super(wordArray);
    this.wordsWithLanguage = wordsWithLanguage;
    this.languageProperties = languageProperties;
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
            ".",
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
      save("numbers", Config.numbers);
    },
    getEmulatedChar(event: KeyboardEvent): string | null {
      if (event.key === "Enter") {
        return " ";
      }
      return null;
    },
  },
  simon_says: {
    applyConfig(): void {
      setConfig("keymapMode", "next", {
        nosave: true,
      });
    },
    rememberSettings(): void {
      save("keymapMode", Config.keymapMode);
    },
  },
  tts: {
    applyConfig(): void {
      setConfig("keymapMode", "off", {
        nosave: true,
      });
    },
    rememberSettings(): void {
      save("keymapMode", Config.keymapMode);
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
      save("highlightMode", Config.highlightMode);
    },
    getEmulatedChar(event: KeyboardEvent): string | null {
      const ekey = event.key;
      if (ekey === "a" || ekey === "ArrowLeft" || ekey === "j") {
        return "←";
      }
      if (ekey === "s" || ekey === "ArrowDown" || ekey === "k") {
        return "↓";
      }
      if (ekey === "w" || ekey === "ArrowUp" || ekey === "i") {
        return "↑";
      }
      if (ekey === "d" || ekey === "ArrowRight" || ekey === "l") {
        return "→";
      }
      return null;
    },
    isCharCorrect(char: string, originalChar: string): boolean {
      if (
        (char === "a" ||
          char === "ArrowLeft" ||
          char === "j" ||
          char === "←") &&
        originalChar === "←"
      ) {
        return true;
      }
      if (
        (char === "s" ||
          char === "ArrowDown" ||
          char === "k" ||
          char === "↓") &&
        originalChar === "↓"
      ) {
        return true;
      }
      if (
        (char === "w" || char === "ArrowUp" || char === "i" || char === "↑") &&
        originalChar === "↑"
      ) {
        return true;
      }
      if (
        (char === "d" ||
          char === "ArrowRight" ||
          char === "l" ||
          char === "→") &&
        originalChar === "→"
      ) {
        return true;
      }
      return false;
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
      let randomCaseWord = "";

      for (let letter of word) {
        if (Math.random() < 0.5) {
          randomCaseWord += letter.toUpperCase();
        } else {
          randomCaseWord += letter.toLowerCase();
        }
      }

      return randomCaseWord;
    },
  },
  sPoNgEcAsE: {
    alterText(word: string): string {
      let spongeCaseWord = "";

      for (let i = 0; i < word.length; i++) {
        if (i % 2 === 0) {
          spongeCaseWord += word[i]?.toLowerCase();
        } else {
          spongeCaseWord += word[i]?.toUpperCase();
        }
      }

      return spongeCaseWord;
    },
  },
  rot13: {
    alterText(word: string): string {
      let alphabet = "abcdefghijklmnopqrstuvwxyz";

      let rot13Word = "";

      for (let ch of word) {
        let chIndex = alphabet.indexOf(ch.toLowerCase());
        if (chIndex === -1) {
          rot13Word += ch;
          continue;
        }

        let rot13Ch = (chIndex + 13) % 26;
        if (ch.toUpperCase() === ch) {
          rot13Word += alphabet[rot13Ch]?.toUpperCase();
        } else {
          rot13Word += alphabet[rot13Ch];
        }
      }

      return rot13Word;
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
      setConfig("layout", layout, {
        nosave: true,
      });
      setConfig("keymapLayout", "overrideSync", {
        nosave: true,
      });
    },
    rememberSettings(): void {
      save("keymapMode", Config.keymapMode);
      save("layout", Config.layout);
    },
  },
  layoutfluid: {
    applyConfig(): void {
      const layout = Config.customLayoutfluid[0] ?? "qwerty";

      setConfig("layout", layout as Layout, {
        nosave: true,
      });
      setConfig("keymapLayout", layout as KeymapLayout, {
        nosave: true,
      });
    },
    rememberSettings(): void {
      save("keymapMode", Config.keymapMode);
      save("layout", Config.layout);
      save("keymapLayout", Config.keymapLayout);
    },
    handleSpace(): void {
      if (Config.mode !== "time") {
        const layouts = Config.customLayoutfluid;
        const outOf: number = TestWords.words.length;
        const wordsPerLayout = Math.floor(outOf / layouts.length);
        const index = Math.floor(
          (TestInput.input.getHistory().length + 1) / wordsPerLayout,
        );
        const mod =
          wordsPerLayout - ((TestState.activeWordIndex + 1) % wordsPerLayout);

        if (layouts[index] as string) {
          if (mod <= 3 && (layouts[index + 1] as string)) {
            LayoutfluidFunboxTimer.show();
            LayoutfluidFunboxTimer.updateWords(
              mod,
              layouts[index + 1] as string,
            );
          } else {
            LayoutfluidFunboxTimer.hide();
          }
          if (mod === wordsPerLayout) {
            setConfig("layout", layouts[index] as Layout);
            setConfig("keymapLayout", layouts[index] as KeymapLayout);
            if (mod > 3) {
              LayoutfluidFunboxTimer.hide();
            }
          }
        } else {
          LayoutfluidFunboxTimer.hide();
        }
        setTimeout(() => {
          void KeymapEvent.highlight(
            TestWords.words.getCurrent().charAt(TestInput.input.current.length),
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
              TestInput.input.current.length + 1,
            ),
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
      save("highlightMode", Config.highlightMode);
    },
    async handleKeydown(event): Promise<void> {
      await readAheadHandleKeydown(event);
    },
  },
  read_ahead: {
    rememberSettings(): void {
      save("highlightMode", Config.highlightMode);
    },
    async handleKeydown(event): Promise<void> {
      await readAheadHandleKeydown(event);
    },
  },
  read_ahead_hard: {
    rememberSettings(): void {
      save("highlightMode", Config.highlightMode);
    },
    async handleKeydown(event): Promise<void> {
      await readAheadHandleKeydown(event);
    },
  },
  memory: {
    applyConfig(): void {
      qs("#wordsWrapper")?.hide();
      setConfig("showAllLines", true, {
        nosave: true,
      });
      if (Config.keymapMode === "next") {
        setConfig("keymapMode", "react", {
          nosave: true,
        });
      }
    },
    rememberSettings(): void {
      save("mode", Config.mode);
      save("showAllLines", Config.showAllLines);
      if (Config.keymapMode === "next") {
        save("keymapMode", Config.keymapMode);
      }
    },
    start(): void {
      MemoryTimer.reset();
      qs("#words")?.hide();
    },
    restart(): void {
      MemoryTimer.start(Math.round(Math.pow(TestWords.words.length, 1.2)));
      qs("#words")?.show();
      if (Config.keymapMode === "next") {
        setConfig("keymapMode", "react");
      }
    },
  },
  nospace: {
    rememberSettings(): void {
      save("highlightMode", Config.highlightMode);
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
      save("numbers", Config.numbers);
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
      save("numbers", Config.numbers);
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
      save("punctuation", Config.punctuation);
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
        navigator.userAgent,
      );
      if (isSafari) {
        //Workaround for bug https://bugs.webkit.org/show_bug.cgi?id=256171 in Safari 16.5 or earlier
        const versionMatch = /.*Version\/([0-9]*)\.([0-9]*).*/.exec(
          navigator.userAgent,
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
            },
          );
          toggleFunbox("crt");
          return;
        }
      }
      qs("body")?.appendHtml('<div id="scanline" />');
      qs("body")?.addClass("crtmode");
      qs("#globalFunBoxTheme")?.setAttribute("href", `funbox/crt.css`);
    },
    clearGlobal(): void {
      qs("#scanline")?.remove();
      qs("body")?.removeClass("crtmode");
      qs("#globalFunBoxTheme")?.setAttribute("href", ``);
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
            0,
          );
          return null;
        }),
      );

      const languages = (await Promise.all(promises)).filter(
        (lang): lang is LanguageObject => lang !== null,
      );

      if (languages.length === 0) {
        toggleFunbox("polyglot");
        throw new Error(
          `No valid languages found. Please check your polyglot languages config (${Config.customPolyglot.join(
            ", ",
          )}).`,
        );
      }

      if (languages.length === 1) {
        const lang = languages[0] as LanguageObject;
        setConfig("language", lang.name, {
          nosave: true,
        });
        toggleFunbox("polyglot", true);
        Notifications.add(
          `Disabled polyglot funbox because only one valid language was found. Check your polyglot languages config (${Config.customPolyglot.join(
            ", ",
          )}).`,
          0,
          {
            duration: 7,
          },
        );
        throw new WordGenError("");
      }

      // direction conflict check
      const allRightToLeft = languages.every((lang) => lang.rightToLeft);
      const allLeftToRight = languages.every((lang) => !lang.rightToLeft);
      const mainLanguage = await JSONData.getLanguage(Config.language);
      const mainLanguageIsRTL = mainLanguage?.rightToLeft ?? false;
      if (
        (mainLanguageIsRTL && allLeftToRight) ||
        (!mainLanguageIsRTL && allRightToLeft)
      ) {
        const fallbackLanguage =
          languages[0]?.name ?? (allRightToLeft ? "arabic" : "english");
        setConfig("language", fallbackLanguage);
        Notifications.add(
          `Language direction conflict: switched to ${fallbackLanguage} for consistency.`,
          0,
          { duration: 5 },
        );
        throw new WordGenError("");
      }

      // build languageProperties
      const languageProperties = new Map(
        languages.map((lang) => [
          lang.name,
          {
            noLazyMode: lang.noLazyMode,
            ligatures: lang.ligatures,
            rightToLeft: lang.rightToLeft,
            additionalAccents: lang.additionalAccents,
          },
        ]),
      );

      const wordsWithLanguage = new Map(
        languages.flatMap((lang) =>
          lang.words.map((word) => [word, lang.name]),
        ),
      );

      return new PolyglotWordset(wordsWithLanguage, languageProperties);
    },
  },
};

export function getFunboxFunctions(): Record<FunboxName, FunboxFunctions> {
  return list as Record<FunboxName, FunboxFunctions>;
}
