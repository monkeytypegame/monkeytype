import * as TestWords from "./test-words";
import { removeTrailingSeparator } from "../utils/strings";
import { showNoticeNotification } from "../states/notifications";

import { Config } from "../config/store";
import { setConfig } from "../config/setters";
import * as CustomText from "./custom-text";
import { configEvent } from "../events/config";
import { Mode } from "@monkeytype/schemas/shared";
import { CustomTextSettings } from "@monkeytype/schemas/results";
import {
  getInputHistory,
  getMissedWords,
  getWordBurstHistory,
} from "./events/stats";
import { setCustomTextIndicator } from "../states/core";
import { lastEventLog } from "./test-state";

type Before = {
  mode: Mode | null;
  punctuation: boolean | null;
  numbers: boolean | null;
  customText: CustomTextSettings | null;
};

export const before: Before = {
  mode: null,
  punctuation: null,
  numbers: null,
  customText: null,
};

export function init(
  missed: "off" | "words" | "biwords",
  slow: boolean,
): boolean {
  if (lastEventLog === null) return false;
  if (Config.mode === "zen") return false;
  let limit;
  if ((missed === "words" && !slow) || (missed === "off" && slow)) {
    limit = 20;
  } else {
    // (biwords) or (missed-words and slow) or (biwords and slow)
    limit = 10;
  }

  const missedWords = getMissedWords(lastEventLog);

  // missed word, previous word, count
  let sortableMissedWords: [string, number][] = [];
  if (missed === "words") {
    Object.keys(missedWords).forEach((missedWord) => {
      const missedWordCount = missedWords[missedWord];
      if (missedWordCount !== undefined) {
        sortableMissedWords.push([missedWord, missedWordCount]);
      }
    });
    sortableMissedWords.sort((a, b) => {
      return b[1] - a[1];
    });
    sortableMissedWords = sortableMissedWords.slice(0, limit);
  }

  let sortableMissedBiwords: [string, string, number][] = [];
  if (missed === "biwords") {
    for (let i = 0; i < TestWords.words.length; i++) {
      const missedWord = removeTrailingSeparator(
        TestWords.words.getText(i) ?? "",
      );
      const missedWordCount = missedWords[missedWord];
      if (missedWordCount !== undefined) {
        if (i === 0) {
          sortableMissedBiwords.push([missedWord, "", missedWordCount]);
        } else {
          sortableMissedBiwords.push([
            missedWord,
            removeTrailingSeparator(TestWords.words.getText(i - 1) ?? ""),
            missedWordCount,
          ]);
        }
      }
    }
    sortableMissedBiwords.sort((a, b) => {
      return b[2] - a[2];
    });
    sortableMissedBiwords = sortableMissedBiwords.slice(0, limit);
  }

  if (
    ((missed === "words" && sortableMissedWords.length === 0) ||
      (missed === "biwords" && sortableMissedBiwords.length === 0)) &&
    !slow
  ) {
    showNoticeNotification("You haven't missed any words");
    return false;
  }

  let sortableSlowWords: [string, number][] = [];
  if (slow) {
    const typedWords = TestWords.words
      .getText()
      .slice(0, getInputHistory(lastEventLog).length - 1);

    const burstHistory = getWordBurstHistory(lastEventLog);

    sortableSlowWords = typedWords.map((e, i) => [e, burstHistory[i] ?? 0]);
    sortableSlowWords.sort((a, b) => {
      return a[1] - b[1];
    });
    sortableSlowWords = sortableSlowWords.slice(
      0,
      Math.min(limit, Math.round(typedWords.length * 0.2)),
    );
    if (sortableSlowWords.length === 0) {
      showNoticeNotification("Test too short to classify slow words.");
    }
  }

  // console.log(sortableMissedWords);
  // console.log(sortableMissedBiwords);
  // console.log(sortableSlowWords);

  if (
    sortableMissedWords.length === 0 &&
    sortableMissedBiwords.length === 0 &&
    sortableSlowWords.length === 0
  ) {
    showNoticeNotification("Could not start a new custom test");
    return false;
  }

  const newCustomText: string[] = [];
  sortableMissedWords.forEach((missed) => {
    for (let i = 0; i < missed[1]; i++) {
      newCustomText.push(missed[0]);
    }
  });

  sortableMissedBiwords.forEach((missedBiwords) => {
    for (let i = 0; i < missedBiwords[2]; i++) {
      if (missedBiwords[1] !== "") {
        newCustomText.push(`${missedBiwords[1]} ${missedBiwords[0]}`);
      } else {
        newCustomText.push(missedBiwords[0]);
      }
    }
  });

  sortableSlowWords.forEach((slow, index) => {
    for (let i = 0; i < sortableSlowWords.length - index; i++) {
      newCustomText.push(slow[0]);
    }
  });

  const mode = before.mode ?? Config.mode;
  const punctuation = before.punctuation ?? Config.punctuation;
  const numbers = before.numbers ?? Config.numbers;

  let customText = null;
  if (Config.mode === "custom") {
    customText = CustomText.getData();
  }

  setConfig("mode", "custom", {
    nosave: true,
  });
  CustomText.setPipeDelimiter(true);
  CustomText.setText(newCustomText);
  CustomText.setLimitMode("section");
  CustomText.setMode("shuffle");
  CustomText.setLimitValue(
    (sortableSlowWords.length +
      sortableMissedWords.length +
      sortableMissedBiwords.length) *
      5,
  );

  setCustomTextIndicator({ name: "practice", isLong: false });

  before.mode = mode;
  before.punctuation = punctuation;
  before.numbers = numbers;
  before.customText = customText;

  return true;
}

export function resetBefore(): void {
  before.mode = null;
  before.punctuation = null;
  before.numbers = null;
  before.customText = null;
}

configEvent.subscribe(({ key }) => {
  if (key === "mode") resetBefore();
});
