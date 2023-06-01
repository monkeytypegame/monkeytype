import Config, * as UpdateConfig from "../config";
import * as FunboxList from "./funbox/funbox-list";
import * as CustomText from "./custom-text";
import * as Wordset from "./wordset";
import QuotesController from "../controllers/quotes-controller";
import * as QuoteSearchPopup from "../popups/quote-search-popup";
import * as TestWords from "./test-words";
import * as BritishEnglish from "./british-english";
import * as LazyMode from "./lazy-mode";
import * as EnglishPunctuation from "./english-punctuation";
import * as PractiseWords from "./practise-words";
import * as Misc from "../utils/misc";

function shouldCapitalize(lastChar: string): boolean {
  return /[?!.؟]/.test(lastChar);
}

let spanishSentenceTracker = "";
export async function punctuateWord(
  previousWord: string,
  currentWord: string,
  index: number,
  maxindex: number
): Promise<string> {
  let word = currentWord;

  const currentLanguage = Config.language.split("_")[0];

  const lastChar = Misc.getLastChar(previousWord);

  const funbox = FunboxList.get(Config.funbox).find(
    (f) => f.functions?.punctuateWord
  );
  if (funbox?.functions?.punctuateWord) {
    return funbox.functions.punctuateWord(word);
  }
  if (
    currentLanguage != "code" &&
    currentLanguage != "georgian" &&
    (index == 0 || shouldCapitalize(lastChar))
  ) {
    //always capitalise the first word or if there was a dot unless using a code alphabet or the Georgian language

    word = Misc.capitalizeFirstLetterOfEachWord(word);

    if (currentLanguage == "turkish") {
      word = word.replace(/I/g, "İ");
    }

    if (currentLanguage == "spanish" || currentLanguage == "catalan") {
      const rand = Math.random();
      if (rand > 0.9) {
        word = "¿" + word;
        spanishSentenceTracker = "?";
      } else if (rand > 0.8) {
        word = "¡" + word;
        spanishSentenceTracker = "!";
      }
    }
  } else if (
    (Math.random() < 0.1 &&
      lastChar != "." &&
      lastChar != "," &&
      index != maxindex - 2) ||
    index == maxindex - 1
  ) {
    if (currentLanguage == "spanish" || currentLanguage == "catalan") {
      if (spanishSentenceTracker == "?" || spanishSentenceTracker == "!") {
        word += spanishSentenceTracker;
        spanishSentenceTracker = "";
      }
    } else {
      const rand = Math.random();
      if (rand <= 0.8) {
        if (currentLanguage == "kurdish") {
          word += ".";
        } else if (currentLanguage === "nepali") {
          word += "।";
        } else {
          word += ".";
        }
      } else if (rand > 0.8 && rand < 0.9) {
        if (currentLanguage == "french") {
          word = "?";
        } else if (
          currentLanguage == "arabic" ||
          currentLanguage == "persian" ||
          currentLanguage == "urdu" ||
          currentLanguage == "kurdish"
        ) {
          word += "؟";
        } else if (currentLanguage == "greek") {
          word += ";";
        } else {
          word += "?";
        }
      } else {
        if (currentLanguage == "french") {
          word = "!";
        } else {
          word += "!";
        }
      }
    }
  } else if (
    Math.random() < 0.01 &&
    lastChar != "," &&
    lastChar != "." &&
    currentLanguage !== "russian"
  ) {
    word = `"${word}"`;
  } else if (
    Math.random() < 0.011 &&
    lastChar != "," &&
    lastChar != "." &&
    currentLanguage !== "russian" &&
    currentLanguage !== "ukrainian" &&
    currentLanguage !== "slovak"
  ) {
    word = `'${word}'`;
  } else if (Math.random() < 0.012 && lastChar != "," && lastChar != ".") {
    if (currentLanguage == "code") {
      const r = Math.random();
      if (r < 0.25) {
        word = `(${word})`;
      } else if (r < 0.5) {
        word = `{${word}}`;
      } else if (r < 0.75) {
        word = `[${word}]`;
      } else {
        word = `<${word}>`;
      }
    } else {
      word = `(${word})`;
    }
  } else if (
    Math.random() < 0.013 &&
    lastChar != "," &&
    lastChar != "." &&
    lastChar != ";" &&
    lastChar != "؛" &&
    lastChar != ":"
  ) {
    if (currentLanguage == "french") {
      word = ":";
    } else if (currentLanguage == "greek") {
      word = "·";
    } else {
      word += ":";
    }
  } else if (
    Math.random() < 0.014 &&
    lastChar != "," &&
    lastChar != "." &&
    previousWord != "-"
  ) {
    word = "-";
  } else if (
    Math.random() < 0.015 &&
    lastChar != "," &&
    lastChar != "." &&
    lastChar != ";" &&
    lastChar != "؛" &&
    lastChar != ":"
  ) {
    if (currentLanguage == "french") {
      word = ";";
    } else if (currentLanguage == "greek") {
      word = "·";
    } else if (currentLanguage == "arabic" || currentLanguage == "kurdish") {
      word += "؛";
    } else {
      word += ";";
    }
  } else if (Math.random() < 0.2 && lastChar != ",") {
    if (
      currentLanguage == "arabic" ||
      currentLanguage == "urdu" ||
      currentLanguage == "persian" ||
      currentLanguage == "kurdish"
    ) {
      word += "،";
    } else {
      word += ",";
    }
  } else if (Math.random() < 0.25 && currentLanguage == "code") {
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
      (Config.language.startsWith("code_c") &&
        !Config.language.startsWith("code_css")) ||
      Config.language.startsWith("code_arduino")
    ) {
      word = Misc.randomElementFromArray(specialsC);
    } else {
      word = Misc.randomElementFromArray(specials);
    }
  } else if (
    Math.random() < 0.5 &&
    currentLanguage === "english" &&
    (await EnglishPunctuation.check(word))
  ) {
    word = await applyEnglishPunctuationToWord(word);
  }
  return word;
}

async function applyEnglishPunctuationToWord(word: string): Promise<string> {
  return EnglishPunctuation.replace(word);
}

function getFunboxWordsFrequency():
  | MonkeyTypes.FunboxWordsFrequency
  | undefined {
  const wordFunbox = FunboxList.get(Config.funbox).find(
    (f) => f.functions?.getWordsFrequencyMode
  );
  if (wordFunbox?.functions?.getWordsFrequencyMode) {
    return wordFunbox.functions.getWordsFrequencyMode();
  }
  return undefined;
}

async function getFunboxSection(limit: number): Promise<string[]> {
  const ret = [];
  const sectionFunbox = FunboxList.get(Config.funbox).find(
    (f) => f.functions?.pullSection
  );
  if (sectionFunbox?.functions?.pullSection) {
    while (ret.length < limit) {
      const section = await sectionFunbox.functions.pullSection(
        Config.language
      );

      if (section === false) {
        UpdateConfig.toggleFunbox(sectionFunbox.name);
        throw new Error("Failed to pull section");
      }

      if (section === undefined) continue;

      for (const word of section.words) {
        if (ret.length >= Config.words && Config.mode == "words") {
          break;
        }
        ret.push(word);
      }
    }
  }
  return ret;
}

function getFunboxWord(
  word: string,
  wordIndex: number,
  wordset?: Wordset.Wordset
): string {
  const wordFunbox = FunboxList.get(Config.funbox).find(
    (f) => f.functions?.getWord
  );
  if (wordFunbox?.functions?.getWord) {
    word = wordFunbox.functions.getWord(wordset, wordIndex);
  }
  return word;
}

function applyFunboxesToWord(word: string): string {
  for (const f of FunboxList.get(Config.funbox)) {
    if (f.functions?.alterText) {
      word = f.functions.alterText(word);
    }
  }
  return word;
}

async function applyBritishEnglishToWord(word: string): Promise<string> {
  if (Config.britishEnglish && /english/.test(Config.language)) {
    word = await BritishEnglish.replace(word);
  }
  return word;
}

function applyLazyModeToWord(
  word: string,
  language: MonkeyTypes.LanguageObject
): string {
  if (Config.lazyMode === true && !language.noLazyMode) {
    word = LazyMode.replaceAccents(word, language.accents);
  }
  return word;
}

export function getWordsLimit(): number {
  let limit = 100;

  const funboxToPush = FunboxList.get(Config.funbox)
    .find((f) => f.properties?.find((fp) => fp.startsWith("toPush")))
    ?.properties?.find((fp) => fp.startsWith("toPush:"));

  if (Config.showAllLines) {
    if (Config.mode === "custom") {
      if (CustomText.isWordRandom) {
        limit = CustomText.word;
      } else if (!CustomText.isTimeRandom && !CustomText.isWordRandom) {
        limit = CustomText.text.length;
      }
    }
    if (Config.mode == "words") {
      limit = Config.words;
    }
  }

  //infinite words
  if (Config.mode === "words" && Config.words === 0) {
    limit = 100;
  }
  if (
    Config.mode === "custom" &&
    CustomText.isWordRandom &&
    CustomText.word === 0
  ) {
    limit = 100;
  }
  if (Config.mode === "custom" && CustomText.delimiter === "|") {
    limit = 100;
  }

  //funboxes
  if (funboxToPush) {
    limit = +funboxToPush.split(":")[1];
  }

  //make sure the limit is not higher than the word count
  if (Config.mode === "words" && Config.words !== 0 && Config.words < limit) {
    limit = Config.words;
  }
  if (
    Config.mode === "custom" &&
    !CustomText.isSectionRandom &&
    !CustomText.isTimeRandom &&
    CustomText.isWordRandom &&
    CustomText.word !== 0 &&
    CustomText.word < limit
  ) {
    limit = CustomText.word;
  }
  if (
    Config.mode === "custom" &&
    !CustomText.isTimeRandom &&
    !CustomText.isWordRandom &&
    !CustomText.isSectionRandom &&
    CustomText.text.length !== 0 &&
    CustomText.text.length < limit
  ) {
    let newLimit = 0;
    for (const word of CustomText.text) {
      if (/ /g.test(word)) {
        newLimit += word.split(" ").length;
      } else {
        newLimit++;
      }
    }

    limit = newLimit;
  }

  return limit;
}

export class WordGenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WordGenError";
  }
}

let currentQuote: string[] = [];

export async function generateWords(
  language: MonkeyTypes.LanguageObject
): Promise<{
  words: string[];
  sectionIndexes: number[];
}> {
  currentQuote = [];
  currentSection = [];
  sectionIndex = 0;
  sectionHistory = [];
  const ret: {
    words: string[];
    sectionIndexes: number[];
  } = {
    words: [],
    sectionIndexes: [],
  };
  const limit = getWordsLimit();

  let wordList = language.words;
  if (Config.mode == "custom") {
    wordList = CustomText.text;
  }
  const wordset = await Wordset.withWords(wordList);

  if (Config.mode === "quote") {
    return await generateQuoteWords(language, wordset, limit);
  }

  if (
    Config.mode === "time" ||
    Config.mode === "words" ||
    Config.mode === "custom"
  ) {
    const funboxSection = await getFunboxSection(limit);
    if (funboxSection.length > 0) {
      const indexes = [];
      for (let i = 0; i < funboxSection.length; i++) {
        indexes.push(i);
      }
      return {
        words: funboxSection,
        sectionIndexes: indexes,
      };
    }

    let stop = false;
    let i = 0;
    while (stop === false) {
      const nextWord = await getNextWord(
        wordset,
        i,
        language,
        limit,
        Misc.nthElementFromArray(ret.words, -1) ?? "",
        Misc.nthElementFromArray(ret.words, -2) ?? ""
      );
      ret.words.push(nextWord.word);
      ret.sectionIndexes.push(nextWord.sectionIndex);

      const randomSectionStop =
        CustomText.isSectionRandom &&
        CustomText.section !== 0 &&
        sectionIndex >= CustomText.section;

      const nonRandomSectionStop =
        !CustomText.isSectionRandom &&
        !CustomText.isTimeRandom &&
        sectionIndex >= wordset.length;

      const customModeStop =
        Config.mode === "custom" &&
        currentSection.length === 0 &&
        CustomText.delimiter === "|" &&
        (randomSectionStop || nonRandomSectionStop);

      if (customModeStop || ret.words.length >= limit) {
        stop = true;
      }
      i++;
    }
  }
  sectionHistory = []; //free up a bit of memory? is that even a thing?
  return ret;
}

async function generateQuoteWords(
  language: MonkeyTypes.LanguageObject,
  wordset: Wordset.Wordset,
  limit: number
): Promise<{
  words: string[];
  sectionIndexes: number[];
}> {
  const ret: {
    words: string[];
    sectionIndexes: number[];
  } = {
    words: [],
    sectionIndexes: [],
  };
  const languageToGet = language.name.startsWith("swiss_german")
    ? "german"
    : language.name;

  const quotesCollection = await QuotesController.getQuotes(
    languageToGet,
    Config.quoteLength
  );

  if (quotesCollection.length === 0) {
    UpdateConfig.setMode("words");
    throw new WordGenError(
      `No ${Config.language
        .replace(/_\d*k$/g, "")
        .replace(/_/g, " ")} quotes found`
    );
  }

  let rq: MonkeyTypes.Quote;
  if (Config.quoteLength.includes(-2) && Config.quoteLength.length === 1) {
    const targetQuote = QuotesController.getQuoteById(
      QuoteSearchPopup.selectedId
    );
    if (targetQuote === undefined) {
      UpdateConfig.setQuoteLength(-1);
      throw new WordGenError(
        `Quote ${QuoteSearchPopup.selectedId} does not exist`
      );
    }
    rq = targetQuote;
  } else if (Config.quoteLength.includes(-3)) {
    const randomQuote = QuotesController.getRandomFavoriteQuote(
      Config.language
    );
    if (randomQuote === null) {
      UpdateConfig.setQuoteLength(-1);
      throw new WordGenError("No favorite quotes found");
    }
    rq = randomQuote;
  } else {
    const randomQuote = QuotesController.getRandomQuote();
    if (randomQuote === null) {
      UpdateConfig.setQuoteLength(-1);
      throw new WordGenError("No quotes found for selected quote length");
    }
    rq = randomQuote;
  }

  rq.language = Config.language.replace(/_\d*k$/g, "");
  rq.text = rq.text.replace(/ +/gm, " ");
  rq.text = rq.text.replace(/\\\\t/gm, "\t");
  rq.text = rq.text.replace(/\\\\n/gm, "\n");
  rq.text = rq.text.replace(/\\t/gm, "\t");
  rq.text = rq.text.replace(/\\n/gm, "\n");
  rq.text = rq.text.replace(/( *(\r\n|\r|\n) *)/g, "\n ");
  rq.text = rq.text.replace(/…/g, "...");
  rq.text = rq.text.trim();
  rq.textSplit = rq.text.split(" ");

  TestWords.setRandomQuote(rq);

  if (TestWords.randomQuote.textSplit === undefined) {
    throw new WordGenError("Random quote textSplit is undefined");
  }

  currentQuote = TestWords.randomQuote.textSplit;

  for (let i = 0; i < Math.min(limit, currentQuote.length); i++) {
    const nextWord = await getNextWord(
      wordset,
      i,
      language,
      limit,
      Misc.nthElementFromArray(ret.words, -1) ?? "",
      Misc.nthElementFromArray(ret.words, -2) ?? ""
    );
    ret.words.push(nextWord.word);
    ret.sectionIndexes.push(i);
  }
  return ret;
}

export let sectionIndex = 0;
export let currentSection: string[] = [];
let sectionHistory: string[] = [];

//generate next word
export async function getNextWord(
  wordset: Wordset.Wordset,
  wordIndex: number,
  language: MonkeyTypes.LanguageObject,
  wordsBound: number,
  previousWord: string,
  previousWord2: string
): Promise<{
  word: string;
  sectionIndex: number;
}> {
  console.debug("Getting next word", {
    wordset,
    wordIndex,
    language,
    wordsBound,
    previousWord,
    previousWord2,
  });
  const funboxFrequency = getFunboxWordsFrequency() ?? "normal";
  let randomWord = wordset.randomWord(funboxFrequency);
  const previousWordRaw = previousWord.replace(/[.?!":\-,]/g, "").toLowerCase();
  const previousWord2Raw = previousWord2
    .replace(/[.?!":\-,']/g, "")
    .toLowerCase();
  if (currentSection.length === 0) {
    if (Config.mode === "quote") {
      randomWord = currentQuote[wordIndex];
    } else if (
      Config.mode == "custom" &&
      !CustomText.isWordRandom &&
      !CustomText.isTimeRandom &&
      !CustomText.isSectionRandom
    ) {
      randomWord = CustomText.text[sectionIndex];
    } else if (
      Config.mode == "custom" &&
      (CustomText.isWordRandom ||
        CustomText.isTimeRandom ||
        CustomText.isSectionRandom) &&
      (wordset.length < 4 || PractiseWords.before.mode !== null)
    ) {
      randomWord = wordset.randomWord(funboxFrequency);
    } else if (Config.mode === "custom" && CustomText.isSectionRandom) {
      randomWord = wordset.randomWord(funboxFrequency);

      const previousSection = Misc.nthElementFromArray(sectionHistory, -1);
      const previousSection2 = Misc.nthElementFromArray(sectionHistory, -2);

      let regenerationCount = 0;
      while (
        regenerationCount < 100 &&
        (previousSection === randomWord || previousSection2 === randomWord)
      ) {
        regenerationCount++;
        randomWord = wordset.randomWord(funboxFrequency);
      }
    } else {
      let regenarationCount = 0; //infinite loop emergency stop button
      let firstAfterSplit = randomWord.split(" ")[0].toLowerCase();
      while (
        regenarationCount < 100 &&
        (previousWordRaw == firstAfterSplit ||
          previousWord2Raw == firstAfterSplit ||
          (Config.mode !== "custom" &&
            !Config.punctuation &&
            randomWord == "I") ||
          (Config.mode !== "custom" &&
            !Config.punctuation &&
            !Config.language.startsWith("code") &&
            /[-=_+[\]{};'\\:"|,./<>?]/i.test(randomWord)) ||
          (Config.mode !== "custom" &&
            !Config.numbers &&
            /[0-9]/i.test(randomWord)))
      ) {
        regenarationCount++;
        randomWord = wordset.randomWord(funboxFrequency);
        firstAfterSplit = randomWord.split(" ")[0];
      }
    }
    randomWord = randomWord.replace(/ +/g, " ");
    randomWord = randomWord.replace(/(^ )|( $)/g, "");

    randomWord = getFunboxWord(randomWord, wordIndex, wordset);

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

  if (
    Config.mode !== "custom" &&
    Config.mode !== "quote" &&
    /[A-Z]/.test(randomWord) &&
    !Config.punctuation &&
    !Config.language.startsWith("german") &&
    !Config.language.startsWith("swiss_german") &&
    !Config.language.startsWith("code")
  ) {
    randomWord = randomWord.toLowerCase();
  }

  randomWord = randomWord.replace(/ +/gm, " ");
  randomWord = randomWord.replace(/(^ )|( $)/gm, "");
  randomWord = applyLazyModeToWord(randomWord, language);
  randomWord = await applyBritishEnglishToWord(randomWord);

  if (Config.language === "swiss_german") {
    randomWord = randomWord.replace(/ß/g, "ss");
  }

  if (Config.punctuation && !language.originalPunctuation === true) {
    randomWord = await punctuateWord(
      previousWord,
      randomWord,
      wordIndex,
      wordsBound
    );
  }
  if (Config.numbers) {
    if (Math.random() < 0.1) {
      randomWord = Misc.getNumbers(4);

      if (Config.language.startsWith("kurdish")) {
        randomWord = Misc.convertNumberToArabic(randomWord);
      } else if (Config.language.startsWith("nepali")) {
        randomWord = Misc.convertNumberToNepali(randomWord);
      }
    }
  }

  randomWord = applyFunboxesToWord(randomWord);

  console.debug("Word:", randomWord);

  return {
    word: randomWord,
    sectionIndex: sectionIndex,
  };
}
