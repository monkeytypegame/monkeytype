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
    CustomText.text.length !== 0 &&
    CustomText.text.length < limit
  ) {
    limit = CustomText.text.length;
  }

  return limit;
}

export class WordGenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WordGenError";
  }
}

export async function generateWords(
  language: MonkeyTypes.LanguageObject
): Promise<string[]> {
  const ret = [];
  const limit = getWordsLimit();

  if (Config.mode === "quote") {
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

    let rq: MonkeyTypes.Quote | undefined = undefined;
    if (Config.quoteLength.includes(-2) && Config.quoteLength.length === 1) {
      const targetQuote = QuotesController.getQuoteById(
        QuoteSearchPopup.selectedId
      );
      if (targetQuote === undefined) {
        // rq = <MonkeyTypes.Quote>quotesCollection.groups[0][0];
        UpdateConfig.setQuoteLength(-1);
        throw new WordGenError(
          `Quote ${QuoteSearchPopup.selectedId} does not exist`
        );
      } else {
        rq = targetQuote;
      }
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

    const w = TestWords.randomQuote.textSplit;

    if (w === undefined) {
      throw new WordGenError("Random quote textSplit is undefined");
    }

    for (let i = 0; i < Math.min(limit, w.length); i++) {
      if (/\t/g.test(w[i])) {
        TestWords.setHasTab(true);
      }

      w[i] = applyLazyModeToWord(w[i], language);
      w[i] = applyFunboxesToWord(w[i]);
      w[i] = await applyBritishEnglishToWord(w[i]);

      if (Config.language === "swiss_german") {
        w[i] = w[i].replace(/ß/g, "ss");
      }

      ret.push(w[i]);
    }
  }

  if (
    Config.mode === "time" ||
    Config.mode === "words" ||
    Config.mode === "custom"
  ) {
    let wordList = language.words;
    if (Config.mode == "custom") {
      wordList = CustomText.text;
    }
    const wordset = await Wordset.withWords(wordList);

    //todo check if this is needed
    let wordCount = 0;

    const sectionFunbox = FunboxList.get(Config.funbox).find(
      (f) => f.functions?.pullSection
    );
    if (sectionFunbox?.functions?.pullSection) {
      while (
        (Config.mode == "words" && Config.words >= wordCount) ||
        (Config.mode === "time" && wordCount < 100)
      ) {
        const section = await sectionFunbox.functions.pullSection(
          Config.language
        );

        if (section === false) {
          UpdateConfig.toggleFunbox(sectionFunbox.name);
          throw new Error("Failed to pull section");
          // Notifications.add(
          //   "Error while getting section. Please try again later",
          //   -1
          // );
          // restart();
          // return;
        }

        if (section === undefined) continue;

        for (const word of section.words) {
          if (wordCount >= Config.words && Config.mode == "words") {
            wordCount++;
            break;
          }
          wordCount++;
          ret.push(word);
        }
      }
    }

    for (let i = 0; i < limit; i++) {
      const randomWord = await getNextWord(wordset, i, language, limit);

      if (/\t/g.test(randomWord)) {
        TestWords.setHasTab(true);
      }

      const te = randomWord.replace(/\n/g, "\n ").replace(/ $/g, "");

      if (/ +/.test(te)) {
        const randomList = te.split(" ");
        let id = 0;
        while (id < randomList.length) {
          ret.push(randomList[id]);
          id++;

          if (
            TestWords.words.length == limit &&
            Config.mode == "custom" &&
            CustomText.isWordRandom
          ) {
            break;
          }
        }
        if (
          Config.mode == "custom" &&
          !CustomText.isWordRandom &&
          !CustomText.isTimeRandom
        ) {
          //
        } else {
          i = TestWords.words.length - 1;
        }
      } else {
        ret.push(randomWord);
      }
    }
  }
  return ret;
}

//generate next word
export async function getNextWord(
  wordset: Wordset.Wordset,
  wordIndex: number,
  language: MonkeyTypes.LanguageObject,
  wordsBound: number
): Promise<string> {
  const funboxFrequency = getFunboxWordsFrequency() ?? "normal";

  let randomWord = wordset.randomWord(funboxFrequency);
  const previousWord = TestWords.words.get(TestWords.words.length - 1, true);
  const previousWord2 = TestWords.words.get(TestWords.words.length - 2, true);
  if (Config.mode === "quote") {
    randomWord =
      TestWords.randomQuote.textSplit?.[TestWords.words.length] ?? "";
  } else if (
    Config.mode == "custom" &&
    !CustomText.isWordRandom &&
    !CustomText.isTimeRandom
  ) {
    randomWord = CustomText.text[TestWords.words.length];
  } else if (
    Config.mode == "custom" &&
    (CustomText.isWordRandom || CustomText.isTimeRandom) &&
    (wordset.length < 4 || PractiseWords.before.mode !== null)
  ) {
    randomWord = wordset.randomWord(funboxFrequency);
  } else {
    let regenarationCount = 0; //infinite loop emergency stop button
    while (
      regenarationCount < 100 &&
      (previousWord == randomWord ||
        previousWord2 == randomWord ||
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
    }
  }

  if (randomWord === undefined) {
    randomWord = wordset.randomWord(funboxFrequency);
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
  randomWord = getFunboxWord(randomWord, wordIndex, wordset);
  randomWord = await applyBritishEnglishToWord(randomWord);

  if (Config.punctuation && !language.originalPunctuation === true) {
    randomWord = await punctuateWord(
      TestWords.words.get(TestWords.words.length - 1),
      randomWord,
      TestWords.words.length,
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

  return randomWord;
}
