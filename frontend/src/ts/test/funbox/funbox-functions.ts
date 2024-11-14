import { FunboxName } from "@monkeytype/funbox/list";
import { Section } from "../../utils/json-data";
import { FunboxWordsFrequency, Wordset } from "../wordset";
import * as GetText from "../../utils/generate";
import Config, * as UpdateConfig from "../../config";
import * as Misc from "../../utils/misc";
import * as Strings from "../../utils/strings";
import { randomIntFromRange } from "@monkeytype/util/numbers";
import * as Arrays from "../../utils/arrays";
import { save } from "./funbox-memory";

//todo figure out how to connect these frontend function names with the ones defined in the shared package
//currently there is nothing ensuring these names match up

type FunboxFunctions = {
  getWord?: (wordset?: Wordset, wordIndex?: number) => string;
  punctuateWord?: (word: string) => string;
  withWords?: (words?: string[]) => Promise<Wordset>;
  alterText?: (word: string) => string;
  applyConfig?: () => void;
  applyGlobalCSS?: () => void;
  clearGlobal?: () => void;
  rememberSettings?: () => void;
  toggleScript?: (params: string[]) => void;
  pullSection?: (language?: string) => Promise<Section | false>;
  handleSpace?: () => void;
  handleChar?: (char: string) => string;
  isCharCorrect?: (char: string, originalChar: string) => boolean;
  preventDefaultEvent?: (
    event: JQuery.KeyDownEvent<Document, null, Document, Document>
  ) => Promise<boolean>;
  handleKeydown?: (
    event: JQuery.KeyDownEvent<Document, null, Document, Document>
  ) => Promise<void>;
  getResultContent?: () => string;
  start?: () => void;
  restart?: () => void;
  getWordHtml?: (char: string, letterTag?: boolean) => string;
  getWordsFrequencyMode?: () => FunboxWordsFrequency;
};

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
};

export function get(funboxName: FunboxName): FunboxFunctions;
export function get(funboxNames: FunboxName[]): FunboxFunctions[];
export function get(
  funboxNameOrNames: FunboxName | FunboxName[]
): FunboxFunctions | FunboxFunctions[] | undefined {
  if (Array.isArray(funboxNameOrNames)) {
    const fns = funboxNameOrNames.map((name) => list[name]);
    return fns.filter((fn) => fn !== undefined);
  } else {
    return list[funboxNameOrNames];
  }
}
