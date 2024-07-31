import Config, * as UpdateConfig from "../config";
import * as FunboxList from "./funbox/funbox-list";
import * as CustomText from "./custom-text";
import * as Wordset from "./wordset";
import QuotesController from "../controllers/quotes-controller";
import * as TestWords from "./test-words";
import * as BritishEnglish from "./british-english";
import * as LazyMode from "./lazy-mode";
import * as EnglishPunctuation from "./english-punctuation";
import * as PractiseWords from "./practise-words";
import * as Misc from "../utils/misc";
import * as Strings from "../utils/strings";
import * as Arrays from "../utils/arrays";
import * as TestState from "../test/test-state";
import * as GetText from "../utils/generate";

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

  const lastChar = Strings.getLastChar(previousWord);

  const funbox = FunboxList.get(Config.funbox).find(
    (f) => f.functions?.punctuateWord
  );
  if (funbox?.functions?.punctuateWord) {
    return funbox.functions.punctuateWord(word);
  }
  if (
    currentLanguage !== "code" &&
    currentLanguage !== "georgian" &&
    (index === 0 || shouldCapitalize(lastChar))
  ) {
    //always capitalise the first word or if there was a dot unless using a code alphabet or the Georgian language

    word = Strings.capitalizeFirstLetterOfEachWord(word);

    if (currentLanguage === "turkish") {
      word = word.replace(/I/g, "İ");
    }

    if (currentLanguage === "spanish" || currentLanguage === "catalan") {
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
      lastChar !== "." &&
      lastChar !== "," &&
      index !== maxindex - 2) ||
    index === maxindex - 1
  ) {
    if (currentLanguage === "spanish" || currentLanguage === "catalan") {
      if (spanishSentenceTracker === "?" || spanishSentenceTracker === "!") {
        word += spanishSentenceTracker;
        spanishSentenceTracker = "";
      }
    } else {
      const rand = Math.random();
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
    Math.random() < 0.01 &&
    lastChar !== "," &&
    lastChar !== "." &&
    currentLanguage !== "russian"
  ) {
    word = `"${word}"`;
  } else if (
    Math.random() < 0.011 &&
    lastChar !== "," &&
    lastChar !== "." &&
    currentLanguage !== "russian" &&
    currentLanguage !== "ukrainian" &&
    currentLanguage !== "slovak"
  ) {
    word = `'${word}'`;
  } else if (Math.random() < 0.012 && lastChar !== "," && lastChar !== ".") {
    if (currentLanguage === "code") {
      const r = Math.random();
      const brackets = ["()", "{}", "[]", "<>"];

      // add `word` in javascript
      if (Config.language.startsWith("code_javascript")) {
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
    Math.random() < 0.013 &&
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
    } else if (currentLanguage === "greek") {
      word = "·";
    } else if (currentLanguage === "chinese") {
      word += "：";
    } else {
      word += ":";
    }
  } else if (
    Math.random() < 0.014 &&
    lastChar !== "," &&
    lastChar !== "." &&
    previousWord !== "-"
  ) {
    word = "-";
  } else if (
    Math.random() < 0.015 &&
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
      word = "·";
    } else if (currentLanguage === "arabic" || currentLanguage === "kurdish") {
      word += "؛";
    } else if (currentLanguage === "chinese") {
      word += "；";
    } else {
      word += ";";
    }
  } else if (Math.random() < 0.2 && lastChar !== ",") {
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
  } else if (Math.random() < 0.25 && currentLanguage === "code") {
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
      word = Arrays.randomElementFromArray(specialsC);
    } else {
      if (Config.language.startsWith("code_javascript")) {
        word = Arrays.randomElementFromArray([...specials, "`"]);
      } else {
        word = Arrays.randomElementFromArray(specials);
      }
    }
  } else if (
    Math.random() < 0.5 &&
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

async function getFunboxSection(): Promise<string[]> {
  const ret = [];
  const sectionFunbox = FunboxList.get(Config.funbox).find(
    (f) => f.functions?.pullSection
  );
  if (sectionFunbox?.functions?.pullSection) {
    const section = await sectionFunbox.functions.pullSection(Config.language);

    if (section === false || section === undefined) {
      UpdateConfig.toggleFunbox(sectionFunbox.name);
      throw new Error("Failed to pull section");
    }

    for (const word of section.words) {
      if (ret.length >= Config.words && Config.mode === "words") {
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

async function applyBritishEnglishToWord(
  word: string,
  previousWord: string
): Promise<string> {
  if (!Config.britishEnglish) return word;
  if (!Config.language.includes("english")) return word;
  if (
    Config.mode === "quote" &&
    TestWords.currentQuote?.britishText !== undefined &&
    TestWords.currentQuote?.britishText !== ""
  ) {
    return word;
  }

  return await BritishEnglish.replace(word, previousWord);
}

function applyLazyModeToWord(
  word: string,
  language: MonkeyTypes.LanguageObject
): string {
  const allowLazyMode = !language.noLazyMode || Config.mode === "custom";
  if (Config.lazyMode && allowLazyMode) {
    word = LazyMode.replaceAccents(word, language.additionalAccents);
  }
  return word;
}

export function getWordOrder(): MonkeyTypes.FunboxWordOrder {
  const wordOrder =
    FunboxList.get(Config.funbox)
      .find((f) => f.properties?.find((fp) => fp.startsWith("wordOrder")))
      ?.properties?.find((fp) => fp.startsWith("wordOrder")) ?? "";

  if (!wordOrder) {
    return "normal";
  } else {
    return wordOrder.split(":")[1] as MonkeyTypes.FunboxWordOrder;
  }
}

export function getWordsLimit(): number {
  if (Config.mode === "zen") {
    return 0;
  }

  let limit = 100;

  const currentQuote = TestWords.currentQuote;

  if (Config.mode === "quote" && currentQuote === null) {
    throw new WordGenError("Random quote is null");
  }

  const funboxToPush =
    FunboxList.get(Config.funbox)
      .find((f) => f.properties?.find((fp) => fp.startsWith("toPush")))
      ?.properties?.find((fp) => fp.startsWith("toPush:")) ?? "";

  if (Config.showAllLines) {
    if (Config.mode === "custom") {
      limit = CustomText.getLimitValue();
    }
    if (Config.mode === "words") {
      limit = Config.words;
    }
    if (Config.mode === "quote") {
      limit = (currentQuote as MonkeyTypes.QuoteWithTextSplit).textSplit.length;
    }
  }

  //infinite words
  if (Config.mode === "words" && Config.words === 0) {
    limit = 100;
  }

  //custom
  if (Config.mode === "custom") {
    if (
      CustomText.getLimitValue() === 0 ||
      CustomText.getLimitMode() === "time"
    ) {
      limit = 100;
    } else {
      limit =
        CustomText.getLimitValue() > 100 ? 100 : CustomText.getLimitValue();
    }
  }

  //funboxes
  if (funboxToPush) {
    limit = +(funboxToPush.split(":")[1] as string);
  }

  //make sure the limit is not higher than the word count
  if (Config.mode === "words" && Config.words !== 0 && Config.words < limit) {
    limit = Config.words;
  }

  if (
    Config.mode === "quote" &&
    (currentQuote as MonkeyTypes.QuoteWithTextSplit).textSplit.length < limit
  ) {
    limit = (currentQuote as MonkeyTypes.QuoteWithTextSplit).textSplit.length;
  }

  if (
    Config.mode === "custom" &&
    CustomText.getLimitMode() === "word" &&
    CustomText.getLimitValue() < limit &&
    CustomText.getLimitValue() !== 0
  ) {
    limit = CustomText.getLimitValue();
  }

  return limit;
}

export class WordGenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WordGenError";
  }
}

async function getQuoteWordList(
  language: MonkeyTypes.LanguageObject,
  wordOrder?: MonkeyTypes.FunboxWordOrder
): Promise<string[]> {
  if (TestState.isRepeated) {
    if (currentWordset === null) {
      throw new WordGenError("Current wordset is null");
    }

    TestWords.setCurrentQuote(previousRandomQuote);

    // need to re-reverse the words if the test is repeated
    // because it will be reversed again in the generateWords function
    if (wordOrder === "reverse") {
      return currentWordset.words.reverse();
    } else {
      return currentWordset.words;
    }
  }
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
      TestState.selectedQuoteId
    );
    if (targetQuote === undefined) {
      UpdateConfig.setQuoteLength(-1);
      throw new WordGenError(
        `Quote ${TestState.selectedQuoteId} does not exist`
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

  rq.language = Strings.removeLanguageSize(Config.language);
  rq.text = rq.text.replace(/ +/gm, " ");
  rq.text = rq.text.replace(/( *(\r\n|\r|\n) *)/g, "\n ");
  rq.text = rq.text.replace(/…/g, "...");
  rq.text = rq.text.trim();

  if (
    rq.britishText !== undefined &&
    rq.britishText !== "" &&
    Config.britishEnglish
  ) {
    rq.textSplit = rq.britishText.split(" ");
  } else {
    rq.textSplit = rq.text.split(" ");
  }

  TestWords.setCurrentQuote(rq as MonkeyTypes.QuoteWithTextSplit);

  if (TestWords.currentQuote === null) {
    throw new WordGenError("Random quote is null");
  }

  if (TestWords.currentQuote.textSplit === undefined) {
    throw new WordGenError("Random quote textSplit is undefined");
  }

  return TestWords.currentQuote.textSplit;
}

let currentWordset: Wordset.Wordset | null = null;
let currentLanguage: MonkeyTypes.LanguageObject | null = null;
let isCurrentlyUsingFunboxSection = false;

type GenerateWordsReturn = {
  words: string[];
  sectionIndexes: number[];
  hasTab: boolean;
  hasNewline: boolean;
};

let previousRandomQuote: MonkeyTypes.QuoteWithTextSplit | null = null;

export async function generateWords(
  language: MonkeyTypes.LanguageObject
): Promise<GenerateWordsReturn> {
  if (!TestState.isRepeated) {
    previousGetNextWordReturns = [];
  }
  previousRandomQuote = TestWords.currentQuote;
  TestWords.setCurrentQuote(null);
  currentSection = [];
  sectionIndex = 0;
  sectionHistory = [];
  currentLanguage = language;
  const ret: GenerateWordsReturn = {
    words: [],
    sectionIndexes: [],
    hasTab: false,
    hasNewline: false,
  };

  const sectionFunbox = FunboxList.get(Config.funbox).find(
    (f) => f.functions?.pullSection
  );
  isCurrentlyUsingFunboxSection =
    sectionFunbox?.functions?.pullSection !== undefined;

  const wordOrder = getWordOrder();
  console.debug("Word order", wordOrder);

  let wordList = language.words;
  if (Config.mode === "custom") {
    wordList = CustomText.getText();
  } else if (Config.mode === "quote") {
    wordList = await getQuoteWordList(language, wordOrder);
  } else if (Config.mode === "zen") {
    wordList = [];
  }

  const limit = getWordsLimit();
  console.debug("Words limit", limit);

  if (wordOrder === "reverse") {
    wordList = wordList.reverse();
  }

  currentWordset = await Wordset.withWords(wordList);
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
      Arrays.nthElementFromArray(ret.words, -1) ?? "",
      Arrays.nthElementFromArray(ret.words, -2) ?? ""
    );
    ret.words.push(nextWord.word);
    ret.sectionIndexes.push(nextWord.sectionIndex);

    if (Config.mode === "custom" && CustomText.getPipeDelimiter()) {
      const sectionFinishedAndOverLimit =
        currentSection.length === 0 &&
        sectionIndex >= CustomText.getLimitValue();
      if (sectionFinishedAndOverLimit) {
        stop = true;
      }
    } else if (ret.words.length >= limit) {
      stop = true;
    }
    i++;
  }

  const quote = TestWords.currentQuote;

  if (Config.mode === "quote" && quote === null) {
    throw new WordGenError("Random quote is null");
  }

  ret.hasTab =
    ret.words.some((w) => w.includes("\t")) ||
    currentWordset.words.some((w) => w.includes("\t")) ||
    (Config.mode === "quote" &&
      (quote as MonkeyTypes.QuoteWithTextSplit).textSplit.some((w) =>
        w.includes("\t")
      ));
  ret.hasNewline =
    ret.words.some((w) => w.includes("\n")) ||
    currentWordset.words.some((w) => w.includes("\n")) ||
    (Config.mode === "quote" &&
      (quote as MonkeyTypes.QuoteWithTextSplit).textSplit.some((w) =>
        w.includes("\n")
      ));

  sectionHistory = []; //free up a bit of memory? is that even a thing?
  return ret;
}

export let sectionIndex = 0;
export let currentSection: string[] = [];
let sectionHistory: string[] = [];

let previousGetNextWordReturns: GetNextWordReturn[] = [];

type GetNextWordReturn = {
  word: string;
  sectionIndex: number;
};

//generate next word
export async function getNextWord(
  wordIndex: number,
  wordsBound: number,
  previousWord: string,
  previousWord2: string | undefined
): Promise<GetNextWordReturn> {
  console.debug("Getting next word", {
    isRepeated: TestState.isRepeated,
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
  if (TestState.isRepeated && Config.mode !== "quote") {
    const repeated = previousGetNextWordReturns[wordIndex];

    if (repeated === undefined) {
      // if the repeated word is undefined, that means we are out of words from the previous test
      // we need to either throw, or revert to random generation
      // reverting should only happen in certain cases

      let continueRandomGeneration = false;

      if (
        Config.mode === "time" ||
        (Config.mode === "custom" && CustomText.getLimitMode() === "time") ||
        (Config.mode === "custom" &&
          CustomText.getLimitMode() === "word" &&
          wordIndex < CustomText.getLimitValue()) ||
        (Config.mode === "words" && wordIndex < Config.words)
      ) {
        continueRandomGeneration = true;
      }

      if (!continueRandomGeneration) {
        throw new WordGenError("Repeated word is undefined");
      } else {
        console.debug(
          "Repeated word is undefined but random generation is allowed - getting random word"
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
  const previousWordRaw = previousWord.replace(/[.?!":\-,]/g, "").toLowerCase();
  const previousWord2Raw = previousWord2
    ?.replace(/[.?!":\-,']/g, "")
    .toLowerCase();

  if (currentSection.length === 0) {
    const funboxSection = await getFunboxSection();

    if (Config.mode === "quote") {
      randomWord = currentWordset.nextWord();
    } else if (Config.mode === "custom" && CustomText.getMode() === "repeat") {
      randomWord = currentWordset.nextWord();
    } else if (
      Config.mode === "custom" &&
      CustomText.getMode() === "random" &&
      (currentWordset.length < 4 || PractiseWords.before.mode !== null)
    ) {
      randomWord = currentWordset.randomWord(funboxFrequency);
    } else if (Config.mode === "custom" && CustomText.getMode() === "shuffle") {
      randomWord = currentWordset.shuffledWord();
    } else if (
      Config.mode === "custom" &&
      CustomText.getLimitMode() === "section"
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
        currentLanguage
      );
      while (
        regenarationCount < 100 &&
        (previousWordRaw === firstAfterSplitLazy ||
          previousWord2Raw === firstAfterSplitLazy ||
          (Config.mode !== "custom" &&
            !Config.punctuation &&
            randomWord === "I") ||
          (Config.mode !== "custom" &&
            !Config.punctuation &&
            !Config.language.startsWith("code") &&
            /[-=_+[\]{};'\\:"|,./<>?]/i.test(randomWord)) ||
          (Config.mode !== "custom" &&
            !Config.numbers &&
            /[0-9]/i.test(randomWord)))
      ) {
        regenarationCount++;
        randomWord = currentWordset.randomWord(funboxFrequency);
        firstAfterSplit = randomWord.split(" ")[0] as string;
        firstAfterSplitLazy = applyLazyModeToWord(
          firstAfterSplit,
          currentLanguage
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

  if (
    Config.mode !== "custom" &&
    Config.mode !== "quote" &&
    /[A-Z]/.test(randomWord) &&
    !Config.punctuation &&
    !Config.language.startsWith("german") &&
    !Config.language.startsWith("swiss_german") &&
    !Config.language.startsWith("code") &&
    !Config.language.startsWith("klingon") &&
    !isCurrentlyUsingFunboxSection
  ) {
    randomWord = randomWord.toLowerCase();
  }

  randomWord = randomWord.replace(/ +/gm, " ");
  randomWord = randomWord.replace(/(^ )|( $)/gm, "");
  randomWord = applyLazyModeToWord(randomWord, currentLanguage);
  randomWord = await applyBritishEnglishToWord(randomWord, previousWordRaw);

  if (Config.language.startsWith("swiss_german")) {
    randomWord = randomWord.replace(/ß/g, "ss");
  }

  if (
    Config.punctuation &&
    !currentLanguage.originalPunctuation &&
    !isCurrentlyUsingFunboxSection
  ) {
    randomWord = await punctuateWord(
      previousWord,
      randomWord,
      wordIndex,
      wordsBound
    );
  }
  if (Config.numbers) {
    if (Math.random() < 0.1) {
      randomWord = GetText.getNumbers(4);

      if (Config.language.startsWith("kurdish")) {
        randomWord = Misc.convertNumberToArabic(randomWord);
      } else if (Config.language.startsWith("nepali")) {
        randomWord = Misc.convertNumberToNepali(randomWord);
      } else if (Config.language.startsWith("bangla")) {
        randomWord = Misc.convertNumberToBangla(randomWord);
      } else if (Config.language.startsWith("hindi")) {
        randomWord = Misc.convertNumberToHindi(randomWord);
      }
    }
  }

  randomWord = applyFunboxesToWord(randomWord);

  console.debug("Word:", randomWord);

  const ret = {
    word: randomWord,
    sectionIndex: sectionIndex,
  };

  previousGetNextWordReturns.push(ret);

  return ret;
}
