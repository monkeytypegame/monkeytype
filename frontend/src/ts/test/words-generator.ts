import { getTestSettings } from "./engine/test-settings";
import { getConfig } from "../config/store";
import { setConfig, setQuoteLengthAll, toggleFunbox } from "../config/setters";
import { Wordset, FunboxWordsFrequency, withWords } from "./wordset";
import {
  Quote,
  QuoteWithTextSplit,
  getQuoteById,
  getLanguageQuotes,
} from "../constants/quotes";
import { pickFavoriteQuote, pickQueuedQuote } from "./quote-picker";
import { getFavoriteQuoteIds } from "../queries/user";
import * as BritishEnglish from "./british-english";
import * as LazyMode from "./lazy-mode";
import * as EnglishPunctuation from "./english-punctuation";
import * as PractiseWords from "./practise-words";
import * as Misc from "../utils/misc";
import * as Strings from "../utils/strings";
import * as Arrays from "../utils/arrays";
import * as GetText from "../utils/generate";
import { FunboxWordOrder } from "../utils/json-data";
import {
  findSingleActiveFunboxWithFunction,
  getActiveFunboxes,
  getActiveFunboxesWithFunction,
  isFunboxActiveWithFunction,
  isFunboxActiveWithProperty,
} from "./funbox/list";
import {
  GenerationSupersededError,
  WordGenError,
} from "../utils/word-gen-error";

import { showLoaderBar, hideLoaderBar } from "../states/loader-bar";
import { PolyglotWordset } from "./funbox/funbox-functions";
import { LanguageObject } from "@monkeytype/schemas/languages";
import { getCurrentQuote, isRepeated, setCurrentQuote } from "../states/test";
import * as TestWords from "./engine/test-words";

//pin implementation
const random = Math.random;

function shouldCapitalize(lastChar: string): boolean {
  return /[?!.؟]/.test(lastChar);
}

let spanishSentenceTracker = "";
export async function punctuateWord(
  previousWord: string | undefined,
  currentWord: string,
  index: number,
  maxindex: number,
): Promise<string> {
  let word = currentWord;

  const currentLanguage = getTestSettings().language.split("_")[0];

  const lastChar =
    previousWord !== undefined ? Strings.getLastChar(previousWord) : undefined;

  const funbox = findSingleActiveFunboxWithFunction("punctuateWord");
  if (funbox) {
    return funbox.functions.punctuateWord(word);
  }
  if (
    currentLanguage !== "code" &&
    currentLanguage !== "georgian" &&
    (index === 0 || (lastChar !== undefined && shouldCapitalize(lastChar)))
  ) {
    //always capitalise the first word or if there was a dot unless using a code alphabet or the Georgian language

    word = Strings.capitalizeFirstLetterOfEachWord(word);

    if (currentLanguage === "turkish") {
      word = word.replace(/I/g, "İ");
    }

    if (currentLanguage === "spanish") {
      const rand = random();
      if (rand > 0.9) {
        word = `¿${word}`;
        spanishSentenceTracker = "?";
      } else if (rand > 0.8) {
        word = `¡${word}`;
        spanishSentenceTracker = "!";
      }
    }
  } else if (
    (random() < 0.1 &&
      lastChar !== "." &&
      lastChar !== "," &&
      index !== maxindex - 2) ||
    index === maxindex - 1
  ) {
    if (currentLanguage === "spanish") {
      if (spanishSentenceTracker === "?" || spanishSentenceTracker === "!") {
        word += spanishSentenceTracker;
        spanishSentenceTracker = "";
      }
    } else {
      const rand = random();
      if (rand <= 0.8) {
        if (currentLanguage === "kurdish") {
          word += ".";
        } else if (
          currentLanguage === "nepali" ||
          currentLanguage === "bangla" ||
          currentLanguage === "hindi"
        ) {
          word += "।";
        } else if (
          currentLanguage === "japanese" ||
          currentLanguage === "chinese"
        ) {
          word += "。";
        } else {
          word += ".";
        }
      } else if (rand > 0.8 && rand < 0.9) {
        if (currentLanguage === "french") {
          word = "?";
        } else if (
          currentLanguage === "arabic" ||
          currentLanguage === "persian" ||
          currentLanguage === "urdu" ||
          currentLanguage === "kurdish"
        ) {
          word += "؟";
        } else if (currentLanguage === "greek") {
          word += ";";
        } else if (
          currentLanguage === "japanese" ||
          currentLanguage === "chinese"
        ) {
          word += "？";
        } else {
          word += "?";
        }
      } else {
        if (currentLanguage === "french") {
          word = "!";
        } else if (
          currentLanguage === "japanese" ||
          currentLanguage === "chinese"
        ) {
          word += "！";
        } else {
          word += "!";
        }
      }
    }
  } else if (
    random() < 0.01 &&
    lastChar !== "," &&
    lastChar !== "." &&
    currentLanguage !== "russian"
  ) {
    word = `"${word}"`;
  } else if (
    random() < 0.011 &&
    lastChar !== "," &&
    lastChar !== "." &&
    currentLanguage !== "russian" &&
    currentLanguage !== "ukrainian" &&
    currentLanguage !== "slovak"
  ) {
    word = `'${word}'`;
  } else if (random() < 0.012 && lastChar !== "," && lastChar !== ".") {
    if (currentLanguage === "code") {
      const r = random();
      const brackets = ["()", "{}", "[]", "<>"];

      // add `word` in javascript
      if (getTestSettings().language.startsWith("code_javascript")) {
        brackets.push("``");
      }

      const index = Math.floor(r * brackets.length);
      const bracket = brackets[index] as string;

      word = `${bracket[0]}${word}${bracket[1]}`;
    } else if (
      currentLanguage === "japanese" ||
      currentLanguage === "chinese"
    ) {
      word = `（${word}）`;
    } else {
      word = `(${word})`;
    }
  } else if (
    random() < 0.013 &&
    lastChar !== "," &&
    lastChar !== "." &&
    lastChar !== ";" &&
    lastChar !== "؛" &&
    lastChar !== ":" &&
    lastChar !== "；" &&
    lastChar !== "："
  ) {
    if (currentLanguage === "french") {
      word = ":";
    } else if (currentLanguage === "chinese") {
      word += "：";
    } else {
      word += ":";
    }
  } else if (
    random() < 0.014 &&
    lastChar !== "," &&
    lastChar !== "." &&
    previousWord !== "-"
  ) {
    word = "-";
  } else if (
    random() < 0.015 &&
    lastChar !== "," &&
    lastChar !== "." &&
    lastChar !== ";" &&
    lastChar !== "؛" &&
    lastChar !== "；" &&
    lastChar !== "："
  ) {
    if (currentLanguage === "french") {
      word = ";";
    } else if (currentLanguage === "greek") {
      // Normally U+00B7 ('middle dot' or 'ano teleia') would be used here.
      // However, a) it has fallen into disuse in contemporary times and
      // b) there isn't a dedicated key on a keyboard to input it
      word = ".";
    } else if (currentLanguage === "arabic" || currentLanguage === "kurdish") {
      word += "؛";
    } else if (currentLanguage === "chinese") {
      word += "；";
    } else {
      word += ";";
    }
  } else if (random() < 0.2 && lastChar !== ",") {
    if (
      currentLanguage === "arabic" ||
      currentLanguage === "urdu" ||
      currentLanguage === "persian" ||
      currentLanguage === "kurdish"
    ) {
      word += "،";
    } else if (currentLanguage === "japanese") {
      word += "、";
    } else if (currentLanguage === "chinese") {
      word += "，";
    } else {
      word += ",";
    }
  } else if (random() < 0.25 && currentLanguage === "code") {
    const specials = ["{", "}", "[", "]", "(", ")", ";", "=", "+", "%", "/"];
    const specialsC = [
      "{",
      "}",
      "[",
      "]",
      "(",
      ")",
      ";",
      "=",
      "+",
      "%",
      "/",
      "/*",
      "*/",
      "//",
      "!=",
      "==",
      "<=",
      ">=",
      "||",
      "&&",
      "<<",
      ">>",
      "%=",
      "&=",
      "*=",
      "++",
      "+=",
      "--",
      "-=",
      "/=",
      "^=",
      "|=",
    ];

    if (
      (getTestSettings().language.startsWith("code_c") &&
        !getTestSettings().language.startsWith("code_css")) ||
      getTestSettings().language.startsWith("code_arduino")
    ) {
      word = Arrays.randomElementFromArray(specialsC);
    } else {
      if (getTestSettings().language.startsWith("code_javascript")) {
        word = Arrays.randomElementFromArray([...specials, "`"]);
      } else {
        word = Arrays.randomElementFromArray(specials);
      }
    }
  } else if (
    random() < 0.5 &&
    currentLanguage === "english" &&
    (await EnglishPunctuation.check(word))
  ) {
    word = await applyEnglishPunctuationToWord(word);
  }

  if (word.includes("\t")) {
    word = word.replace(/\t/g, "");
    word += "\t";
  }
  if (word.includes("\n")) {
    word = word.replace(/\n/g, "");
    word += "\n";
  }

  return word;
}

async function applyEnglishPunctuationToWord(word: string): Promise<string> {
  return EnglishPunctuation.replace(word);
}

function getFunboxWordsFrequency(): FunboxWordsFrequency | undefined {
  const funbox = findSingleActiveFunboxWithFunction("getWordsFrequencyMode");
  if (funbox) {
    return funbox.functions.getWordsFrequencyMode();
  }
  return undefined;
}

async function getFunboxSection(): Promise<string[]> {
  const ret = [];

  const funbox = findSingleActiveFunboxWithFunction("pullSection");

  if (funbox) {
    const section = await funbox.functions.pullSection(
      getTestSettings().language,
    );

    if (section === false || section === undefined) {
      toggleFunbox(funbox.name);
      throw new Error("Failed to pull section");
    }

    for (const word of section.words) {
      if (
        ret.length >= getTestSettings().words &&
        getTestSettings().mode === "words"
      ) {
        break;
      }
      ret.push(word);
    }
  }
  return ret;
}

function getFunboxWord(
  word: string,
  wordIndex: number,
  wordset?: Wordset,
): string {
  const funbox = findSingleActiveFunboxWithFunction("getWord");

  if (funbox) {
    word = funbox.functions.getWord(wordset, wordIndex);
  }
  return word;
}

function applyFunboxesToWord(
  word: string,
  wordIndex: number,
  wordsBound: number,
): string {
  for (const fb of getActiveFunboxesWithFunction("alterText")) {
    word = fb.functions.alterText(word, wordIndex, wordsBound);
  }
  return word;
}

async function applyBritishEnglishToWord(
  word: string,
  previousWord: string | undefined,
): Promise<string> {
  if (!getTestSettings().britishEnglish) return word;
  if (!getTestSettings().language.includes("english")) return word;
  const currentQuote = getCurrentQuote();
  if (
    getTestSettings().mode === "quote" &&
    currentQuote?.britishText !== undefined &&
    currentQuote?.britishText !== ""
  ) {
    return word;
  }

  return await BritishEnglish.replace(word, previousWord);
}

function applyLazyModeToWord(word: string, language: LanguageObject): string {
  // polyglot mode, use the word's actual language
  if (currentWordset && currentWordset instanceof PolyglotWordset) {
    const langName = currentWordset.wordsWithLanguage.get(word);
    const langProps = langName
      ? currentWordset.languageProperties.get(langName)
      : undefined;
    const allowLazyMode =
      (langProps && !langProps.noLazyMode) === true ||
      getTestSettings().mode === "custom";
    if (getTestSettings().lazyMode && allowLazyMode && langProps) {
      word = LazyMode.replaceAccents(word, langProps.additionalAccents);
    }
    return word;
  }

  // normal mode
  const allowLazyMode =
    !language.noLazyMode || getTestSettings().mode === "custom";
  if (getTestSettings().lazyMode && allowLazyMode) {
    word = LazyMode.replaceAccents(word, language.additionalAccents);
  }
  return word;
}

export function getWordOrder(): FunboxWordOrder {
  const wordOrderProperty = getActiveFunboxes()
    .flatMap((fb) => fb.properties ?? [])
    .find((prop) => prop.startsWith("wordOrder:"));

  return (wordOrderProperty?.split(":")[1] as FunboxWordOrder) ?? "normal";
}

export function getLimit(): number {
  if (getTestSettings().mode === "zen") {
    return 0;
  }

  let limit = 100;

  const currentQuote = getCurrentQuote();

  if (getTestSettings().mode === "quote" && currentQuote === null) {
    throw new WordGenError("Random quote is null");
  }

  const funboxToPush =
    getActiveFunboxes()
      .flatMap((fb) => fb.properties ?? [])
      .find((prop) => prop.startsWith("toPush:")) ?? "";

  if (getConfig.showAllLines) {
    if (getTestSettings().mode === "custom") {
      limit = getTestSettings().customText.limit.value;
    }
    if (getTestSettings().mode === "words") {
      limit = getTestSettings().words;
    }
    if (getTestSettings().mode === "quote") {
      limit = (currentQuote as QuoteWithTextSplit).textSplit.length;
    }
  }

  //infinite words
  if (getTestSettings().mode === "words" && getTestSettings().words === 0) {
    limit = 100;
  }

  //custom
  if (getTestSettings().mode === "custom") {
    if (
      getTestSettings().customText.limit.value === 0 ||
      getTestSettings().customText.limit.mode === "time"
    ) {
      limit = 100;
    } else {
      limit =
        getTestSettings().customText.limit.value > 100
          ? 100
          : getTestSettings().customText.limit.value;
    }
  }

  //funboxes
  if (funboxToPush) {
    limit = +(funboxToPush.split(":")[1] as string);
  }

  //make sure the limit is not higher than the word count
  if (
    getTestSettings().mode === "words" &&
    getTestSettings().words !== 0 &&
    getTestSettings().words < limit
  ) {
    limit = getTestSettings().words;
  }

  if (
    getTestSettings().mode === "quote" &&
    (currentQuote as QuoteWithTextSplit).textSplit.length < limit
  ) {
    limit = (currentQuote as QuoteWithTextSplit).textSplit.length;
  }

  if (
    getTestSettings().mode === "custom" &&
    getTestSettings().customText.limit.mode === "word" &&
    getTestSettings().customText.limit.value < limit &&
    getTestSettings().customText.limit.value !== 0
  ) {
    limit = getTestSettings().customText.limit.value;
  }

  return limit;
}

async function getQuoteWordList(
  language: LanguageObject,
  isCurrent: () => boolean,
  wordOrder?: FunboxWordOrder,
): Promise<string[]> {
  if (isRepeated()) {
    if (currentWordset === null) {
      throw new WordGenError("Current wordset is null");
    }

    setCurrentQuote(previousRandomQuote);

    // need to re-reverse the words if the test is repeated
    // because it will be reversed again in the generateWords function
    if (wordOrder === "reverse") {
      return currentWordset.words.reverse();
    } else {
      return currentWordset.words;
    }
  }
  showLoaderBar();
  const languageQuotes = await getLanguageQuotes(language.name);
  hideLoaderBar();
  assertCurrent(isCurrent);

  if (languageQuotes.quotes.length === 0) {
    setConfig("mode", "words");
    throw new WordGenError(
      `No ${getTestSettings()
        .language.replace(/_\d*k$/g, "")
        .replace(/_/g, " ")} quotes found`,
    );
  }

  let picked: Quote;
  if (
    getTestSettings().quoteLength.includes(-2) &&
    getTestSettings().quoteLength.length === 1
  ) {
    const targetQuote = getQuoteById(
      languageQuotes,
      getTestSettings().selectedQuoteId,
    );
    if (targetQuote === undefined) {
      setQuoteLengthAll();
      throw new WordGenError(
        `Quote ${getTestSettings().selectedQuoteId} does not exist`,
      );
    }
    picked = targetQuote;
  } else if (getTestSettings().quoteLength.includes(-3)) {
    const randomQuote = pickFavoriteQuote(
      languageQuotes,
      getFavoriteQuoteIds(getTestSettings().language),
    );
    if (randomQuote === null) {
      setQuoteLengthAll();
      throw new WordGenError("No favorite quotes found");
    }
    picked = randomQuote;
  } else {
    const randomQuote = pickQueuedQuote(
      languageQuotes,
      getTestSettings().quoteLength,
    );
    if (randomQuote === null) {
      setQuoteLengthAll();
      throw new WordGenError("No quotes found for selected quote length");
    }
    picked = randomQuote;
  }

  // a copy: the loaded quotes stay unchanged
  const text = picked.text
    .replace(/ +/gm, " ")
    .replace(/( *(\r\n|\r|\n) *)/g, "\n ")
    .replace(/…/g, "...")
    .trim();
  const textSplit =
    picked.britishText !== undefined &&
    picked.britishText !== "" &&
    getTestSettings().britishEnglish
      ? picked.britishText.split(" ")
      : text.split(" ");
  const rq: QuoteWithTextSplit = {
    ...picked,
    language: Strings.removeLanguageSize(getTestSettings().language),
    text,
    textSplit,
  };

  setCurrentQuote(rq);

  const currentQuote = getCurrentQuote();
  if (currentQuote === null) {
    throw new WordGenError("Random quote is null");
  }

  if (currentQuote.textSplit === undefined) {
    throw new WordGenError("Random quote textSplit is undefined");
  }

  return currentQuote.textSplit;
}

let currentWordset: Wordset | null = null;
let currentLanguage: LanguageObject | null = null;
let isCurrentlyUsingFunboxSection = false;

type TestWordFacts = {
  hasTab: boolean;
  hasNewline: boolean;
  hasNumbers: boolean;
  hasKorean: boolean;
};

type GenerateWordsReturn = TestWordFacts & {
  words: string[];
  sectionIndexes: number[];
  allJoiningScript?: boolean;
};

const koreanRegex =
  /[\u1100-\u11ff\u3130-\u318f\ua960-\ua97f\uac00-\ud7af\ud7b0-\ud7ff]/;

/**
 * Facts about the whole test. Pass the wordset too, not just the generated
 * words: only the first words are generated up front, the rest stream in during
 * the test and the answers have to hold from the start.
 */
export function getTestWordFacts(wordLists: string[][]): TestWordFacts {
  const text = wordLists.flat().join(" ");
  return {
    hasTab: text.includes("\t"),
    hasNewline: text.includes("\n"),
    hasNumbers: /\p{N}/u.test(text),
    hasKorean: koreanRegex.test(text),
  };
}

let previousRandomQuote: QuoteWithTextSplit | null = null;

/**
 * A superseded generation must stop before it touches the generator's state
 * again: the newer one shares it (the wordset's order, the sections).
 */
function assertCurrent(isCurrent: () => boolean): void {
  if (!isCurrent()) throw new GenerationSupersededError();
}

/**
 * `isCurrent`: false once a newer generation took over. Throws
 * GenerationSupersededError then, at the next step.
 */
export async function generateWords(
  language: LanguageObject,
  isCurrent: () => boolean,
): Promise<GenerateWordsReturn> {
  if (!isRepeated()) {
    previousGetNextWordReturns = [];
  }
  previousRandomQuote = getCurrentQuote();
  setCurrentQuote(null);
  currentSection = [];
  sectionIndex = 0;
  sectionHistory = [];
  currentLanguage = language;
  const rawWordList: string[] = [];
  const ret: GenerateWordsReturn = {
    words: [],
    sectionIndexes: [],
    hasTab: false,
    hasNewline: false,
    hasNumbers: false,
    hasKorean: false,
    allJoiningScript: language.joiningScript ?? false,
  };

  isCurrentlyUsingFunboxSection = isFunboxActiveWithFunction("pullSection");

  const wordOrder = getWordOrder();
  console.debug("Word order", wordOrder);

  let wordList = language.words;
  if (getTestSettings().mode === "custom") {
    wordList = getTestSettings().customText.text;
  } else if (getTestSettings().mode === "quote") {
    wordList = await getQuoteWordList(language, isCurrent, wordOrder);
  } else if (getTestSettings().mode === "zen") {
    wordList = [];
  }

  const customAndUsingPipeDelimiter =
    getTestSettings().mode === "custom" &&
    getTestSettings().customText.pipeDelimiter;

  const limit = getLimit();
  console.debug(
    `${customAndUsingPipeDelimiter ? "Section" : "Word"} limit ${limit}`,
  );

  if (wordOrder === "reverse") {
    wordList = wordList.reverse();
  }

  const funbox = findSingleActiveFunboxWithFunction("withWords");
  if (funbox) {
    const result = await funbox.functions.withWords(wordList);
    assertCurrent(isCurrent);
    // PolyglotWordset if polyglot otherwise Wordset
    if (result instanceof PolyglotWordset) {
      const polyglotResult = result;
      currentWordset = polyglotResult;
      // set allJoiningScript if any language in languageProperties has joiningScript: true
      ret.allJoiningScript = Array.from(
        polyglotResult.languageProperties.values(),
      ).some((props) => !!props.joiningScript);
    } else {
      currentWordset = result;
    }
  } else {
    currentWordset = await withWords(wordList);
    assertCurrent(isCurrent);
  }

  console.debug("Wordset", currentWordset);

  if (limit === 0) {
    return ret;
  }

  let stop = false;
  let i = 0;
  while (!stop) {
    const nextWord = await getNextWord(
      i,
      limit,
      Arrays.nthElementFromArray(rawWordList, -1) ?? "",
      Arrays.nthElementFromArray(rawWordList, -2) ?? "",
      isCurrent,
    );
    rawWordList.push(nextWord.wordRaw);
    ret.words.push(nextWord.word);
    ret.sectionIndexes.push(nextWord.sectionIndex);

    if (customAndUsingPipeDelimiter) {
      //generate a given number of sections, make sure to not cut a section off
      const sectionFinishedAndOverLimit =
        currentSection.length === 0 && sectionIndex >= limit;
      //make sure we dont go over a hard limit, in cases where the sections are very large
      const upperWordLimit = ret.words.length >= 100;
      if (sectionFinishedAndOverLimit || upperWordLimit) {
        stop = true;
      }
    } else if (ret.words.length >= limit) {
      stop = true;
    }
    i++;
  }
  assertCurrent(isCurrent);

  const quote = getCurrentQuote();

  if (getTestSettings().mode === "quote" && quote === null) {
    throw new WordGenError("Random quote is null");
  }

  const facts = getTestWordFacts([
    ret.words,
    currentWordset.words,
    getTestSettings().mode === "quote"
      ? (quote as QuoteWithTextSplit).textSplit
      : [],
  ]);

  sectionHistory = []; //free up a bit of memory? is that even a thing?
  return { ...ret, ...facts };
}

export let sectionIndex = 0;
export let currentSection: string[] = [];
let sectionHistory: string[] = [];

let previousGetNextWordReturns: GetNextWordReturn[] = [];

type GetNextWordReturn = {
  word: string;
  wordRaw: string;
  sectionIndex: number;
};

//generate next word
export async function getNextWord(
  wordIndex: number,
  wordsBound: number,
  previousWord: string | undefined,
  previousWord2: string | undefined,
  isCurrent: () => boolean = () => true,
): Promise<GetNextWordReturn> {
  assertCurrent(isCurrent);
  console.debug("Getting next word", {
    isRepeated: isRepeated(),
    currentWordset,
    wordIndex,
    language: currentLanguage,
    wordsBound,
    previousWord,
    previousWord2,
  });

  if (currentWordset === null) {
    throw new WordGenError("Current wordset is null");
  }

  if (currentLanguage === null) {
    throw new WordGenError("Current language is null");
  }

  //because quote test can be repeated in the middle of a test
  //we cant rely on data inside previousGetNextWordReturns
  //because it might not include the full quote
  if (isRepeated() && getTestSettings().mode !== "quote") {
    const repeated = previousGetNextWordReturns[wordIndex];

    if (repeated === undefined) {
      // if the repeated word is undefined, that means we are out of words from the previous test
      // we need to either throw, or revert to random generation
      // reverting should only happen in certain cases

      let continueRandomGeneration = false;

      if (
        getTestSettings().mode === "time" ||
        (getTestSettings().mode === "custom" &&
          getTestSettings().customText.limit.mode === "time") ||
        (getTestSettings().mode === "custom" &&
          getTestSettings().customText.limit.mode === "word" &&
          wordIndex < getTestSettings().customText.limit.value) ||
        (getTestSettings().mode === "custom" &&
          getTestSettings().customText.limit.mode === "section" &&
          sectionIndex < getTestSettings().customText.limit.value) ||
        (getTestSettings().mode === "words" &&
          wordIndex < getTestSettings().words)
      ) {
        continueRandomGeneration = true;
      }

      if (!continueRandomGeneration) {
        throw new WordGenError("Repeated word is undefined");
      } else {
        console.debug(
          "Repeated word is undefined but random generation is allowed - getting random word",
        );
      }
    } else {
      console.debug("Repeated word: ", repeated);
      sectionIndex++;
      return repeated;
    }
  }

  const funboxFrequency = getFunboxWordsFrequency() ?? "normal";
  let randomWord = currentWordset.randomWord(funboxFrequency);
  const previousWordRaw = previousWord
    ?.replace(/[.?!":\-,]/g, "")
    .toLowerCase();
  const previousWord2Raw = previousWord2
    ?.replace(/[.?!":\-,']/g, "")
    .toLowerCase();

  if (currentSection.length === 0) {
    const funboxSection = await getFunboxSection();
    assertCurrent(isCurrent);

    if (getTestSettings().mode === "quote") {
      randomWord = currentWordset.nextWord();
    } else if (
      getTestSettings().mode === "custom" &&
      getTestSettings().customText.mode === "repeat"
    ) {
      randomWord = currentWordset.nextWord();
    } else if (
      getTestSettings().mode === "custom" &&
      getTestSettings().customText.mode === "random" &&
      (currentWordset.length < 4 || PractiseWords.before.mode !== null)
    ) {
      randomWord = currentWordset.randomWord(funboxFrequency);
    } else if (
      getTestSettings().mode === "custom" &&
      getTestSettings().customText.mode === "shuffle"
    ) {
      randomWord = currentWordset.shuffledWord();
    } else if (
      getTestSettings().mode === "custom" &&
      getTestSettings().customText.limit.mode === "section"
    ) {
      randomWord = currentWordset.randomWord(funboxFrequency);

      const previousSection = Arrays.nthElementFromArray(sectionHistory, -1);
      const previousSection2 = Arrays.nthElementFromArray(sectionHistory, -2);

      let regenerationCount = 0;
      while (
        regenerationCount < 100 &&
        (previousSection === randomWord || previousSection2 === randomWord)
      ) {
        regenerationCount++;
        randomWord = currentWordset.randomWord(funboxFrequency);
      }
    } else if (isCurrentlyUsingFunboxSection) {
      randomWord = funboxSection.join(" ");
    } else {
      let regenarationCount = 0; //infinite loop emergency stop button
      let firstAfterSplit = (randomWord.split(" ")[0] as string).toLowerCase();
      let firstAfterSplitLazy = applyLazyModeToWord(
        firstAfterSplit,
        currentLanguage,
      );
      while (
        regenarationCount < 100 &&
        (previousWordRaw === firstAfterSplitLazy ||
          previousWord2Raw === firstAfterSplitLazy ||
          (getTestSettings().mode !== "custom" &&
            !getTestSettings().punctuation &&
            randomWord === "I") ||
          (getTestSettings().mode !== "custom" &&
            !getTestSettings().punctuation &&
            !getTestSettings().language.startsWith("code") &&
            /[-=_+[\]{};'\\:"|,./<>?]/i.test(randomWord)) ||
          (getTestSettings().mode !== "custom" &&
            !getTestSettings().numbers &&
            /[0-9]/i.test(randomWord)))
      ) {
        regenarationCount++;
        randomWord = currentWordset.randomWord(funboxFrequency);
        firstAfterSplit = randomWord.split(" ")[0] as string;
        firstAfterSplitLazy = applyLazyModeToWord(
          firstAfterSplit,
          currentLanguage,
        );
      }
    }
    randomWord = randomWord.replace(/ +/g, " ");
    randomWord = randomWord.replace(/(^ )|( $)/g, "");

    randomWord = getFunboxWord(randomWord, wordIndex, currentWordset);

    currentSection = [...randomWord.split(" ")];
    sectionHistory.push(randomWord);
    randomWord = currentSection.shift() as string;
    sectionIndex++;
  } else {
    randomWord = currentSection.shift() as string;
  }

  if (randomWord === undefined) {
    throw new WordGenError("Random word is undefined");
  }

  if (randomWord === "") {
    throw new WordGenError("Random word is empty");
  }

  if (/ /g.test(randomWord)) {
    throw new WordGenError("Random word contains spaces");
  }

  const usingFunboxWithGetWord = isFunboxActiveWithFunction("getWord");
  const randomWordLanguage =
    (currentWordset instanceof PolyglotWordset
      ? currentWordset.wordsWithLanguage.get(randomWord)
      : getTestSettings().language) ?? getTestSettings().language; // Fall back to getConfig language if per-word language is unavailable

  if (
    getTestSettings().mode !== "custom" &&
    getTestSettings().mode !== "quote" &&
    /[A-Z]/.test(randomWord) &&
    !getTestSettings().punctuation &&
    !randomWordLanguage.startsWith("german") &&
    !randomWordLanguage.startsWith("swiss_german") &&
    !randomWordLanguage.startsWith("code") &&
    !randomWordLanguage.startsWith("klingon") &&
    !isCurrentlyUsingFunboxSection &&
    !usingFunboxWithGetWord
  ) {
    randomWord = randomWord.toLowerCase();
  }

  randomWord = randomWord.replace(/ +/gm, " ");
  randomWord = randomWord.replace(/(^ )|( $)/gm, "");
  randomWord = applyLazyModeToWord(randomWord, currentLanguage);

  if (getTestSettings().language.startsWith("swiss_german")) {
    randomWord = randomWord.replace(/ß/g, "ss");
  }

  if (
    getTestSettings().punctuation &&
    !currentLanguage.originalPunctuation &&
    !isCurrentlyUsingFunboxSection
  ) {
    randomWord = await punctuateWord(
      previousWord,
      randomWord,
      wordIndex,
      wordsBound,
    );
    assertCurrent(isCurrent);
  }

  randomWord = await applyBritishEnglishToWord(randomWord, previousWordRaw);
  assertCurrent(isCurrent);

  if (getTestSettings().numbers) {
    if (random() < 0.1) {
      randomWord = GetText.getNumbers(4);

      if (getTestSettings().language.startsWith("kurdish")) {
        randomWord = Misc.convertNumberToArabic(randomWord);
      } else if (getTestSettings().language.startsWith("nepali")) {
        randomWord = Misc.convertNumberToNepali(randomWord);
      } else if (getTestSettings().language.startsWith("bangla")) {
        randomWord = Misc.convertNumberToBangla(randomWord);
      } else if (getTestSettings().language.startsWith("hindi")) {
        randomWord = Misc.convertNumberToHindi(randomWord);
      }
    }
  }

  randomWord = applyFunboxesToWord(randomWord, wordIndex, wordsBound);

  console.debug("Word:", randomWord);

  const ret = {
    word: appendCommitCharacter(randomWord),
    wordRaw: randomWord,
    sectionIndex: sectionIndex,
  };

  previousGetNextWordReturns.push(ret);

  return ret;
}

/**
 * Appends the inter-word commit separator the way the generator does: a trailing
 * space, unless the word already ends with a newline or the nospace funbox is
 * active. Callers that push words outside of getNextWord (e.g. section funbox
 * pulls) must use this so the separator is part of the target word.
 */
export function appendCommitCharacter(word: string): string {
  if (word.endsWith("\n") || isFunboxActiveWithProperty("nospace")) {
    return word;
  }
  return `${word} `;
}

export function areAllWordsGenerated(): boolean {
  return (
    (getTestSettings().mode === "words" &&
      TestWords.words.length >= getTestSettings().words &&
      getTestSettings().words > 0) ||
    (getTestSettings().mode === "custom" &&
      getTestSettings().customText.limit.mode === "word" &&
      TestWords.words.length >= getTestSettings().customText.limit.value &&
      getTestSettings().customText.limit.value !== 0) ||
    (getTestSettings().mode === "quote" &&
      TestWords.words.length >= (getCurrentQuote()?.textSplit?.length ?? 0)) ||
    (getTestSettings().mode === "custom" &&
      getTestSettings().customText.limit.mode === "section" &&
      sectionIndex >= getTestSettings().customText.limit.value &&
      currentSection.length === 0 &&
      getTestSettings().customText.limit.value !== 0)
  );
}
