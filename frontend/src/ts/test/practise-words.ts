import * as TestWords from "./test-words";
import * as Notifications from "../elements/notifications";
import Config, * as UpdateConfig from "../config";
import * as CustomText from "./custom-text";
import * as TestInput from "./test-input";
import * as ConfigEvent from "../observables/config-event";
import { setCustomTextName } from "../states/custom-text-name";
import * as Skeleton from "../utils/skeleton";
import { isPopupVisible } from "../utils/misc";

const wrapperId = "practiseWordsPopupWrapper";

type Before = {
  mode: SharedTypes.Config.Mode | null;
  punctuation: boolean | null;
  numbers: boolean | null;
  customText: SharedTypes.CustomTextData | null;
};

export const before: Before = {
  mode: null,
  punctuation: null,
  numbers: null,
  customText: null,
};

export function init(missed: boolean, slow: boolean): boolean {
  if (Config.mode === "zen") return false;
  let limit;
  if ((missed && !slow) || (!missed && slow)) {
    limit = 20;
  } else if (missed && slow) {
    limit = 10;
  } else {
    limit = 10;
  }

  let sortableMissedWords: [string, number][] = [];
  if (missed) {
    Object.keys(TestInput.missedWords).forEach((missedWord) => {
      const missedWordCount = TestInput.missedWords[missedWord];
      if (missedWordCount !== undefined) {
        sortableMissedWords.push([missedWord, missedWordCount]);
      }
    });
    sortableMissedWords.sort((a, b) => {
      return b[1] - a[1];
    });
    sortableMissedWords = sortableMissedWords.slice(0, limit);
  }

  if (missed && !slow && sortableMissedWords.length === 0) {
    Notifications.add("You haven't missed any words", 0);
    return false;
  }

  let sortableSlowWords: [string, number][] = [];
  if (slow) {
    sortableSlowWords = TestWords.words
      .get()
      .map((e, i) => [e, TestInput.burstHistory[i] ?? 0]);
    sortableSlowWords.sort((a, b) => {
      return a[1] - b[1];
    });
    sortableSlowWords = sortableSlowWords.slice(
      0,
      Math.min(limit, Math.round(TestWords.words.length * 0.2))
    );
  }

  // console.log(sortableMissedWords);
  // console.log(sortableSlowWords);

  if (sortableMissedWords.length === 0 && sortableSlowWords.length === 0) {
    Notifications.add("Could not start a new custom test", 0);
    return false;
  }

  const newCustomText: string[] = [];
  sortableMissedWords.forEach((missed) => {
    for (let i = 0; i < missed[1]; i++) {
      newCustomText.push(missed[0]);
    }
  });

  sortableSlowWords.forEach((slow, index) => {
    for (let i = 0; i < sortableSlowWords.length - index; i++) {
      newCustomText.push(slow[0]);
    }
  });

  // console.log(newCustomText);

  const mode = before.mode === null ? Config.mode : before.mode;
  const punctuation =
    before.punctuation === null ? Config.punctuation : before.punctuation;
  const numbers = before.numbers === null ? Config.numbers : before.numbers;

  let customText = null;
  if (Config.mode === "custom") {
    customText = CustomText.getData();
  }

  UpdateConfig.setMode("custom", true);
  CustomText.setText(newCustomText);
  CustomText.setLimitMode("word");
  CustomText.setLimitValue(
    (sortableSlowWords.length + sortableMissedWords.length) * 5
  );

  setCustomTextName("practise", undefined);

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

export function showPopup(): void {
  if (Config.mode === "zen") {
    Notifications.add("Practice words is unsupported in zen mode", 0);
    return;
  }
  Skeleton.append(wrapperId, "popups");
  if (!isPopupVisible(wrapperId)) {
    $("#practiseWordsPopupWrapper")
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, 100, () => {
        $(`#${wrapperId}`).trigger("focus");
      });
  }
}

export function hidePopup(): void {
  if (isPopupVisible(wrapperId)) {
    $("#practiseWordsPopupWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        100,
        () => {
          $("#practiseWordsPopupWrapper").addClass("hidden");
          Skeleton.remove(wrapperId);
        }
      );
  }
}

$("#practiseWordsPopupWrapper").on("click", (e) => {
  if ($(e.target).attr("id") === "practiseWordsPopupWrapper") {
    hidePopup();
  }
});

$("#practiseWordsPopupWrapper .button").on("keypress", (e) => {
  if (e.key === "Enter") {
    $(e.currentTarget).trigger("click");
  }
});

$(document).on("keydown", (event) => {
  if (event.key === "Escape" && isPopupVisible(wrapperId)) {
    hidePopup();
    event.preventDefault();
  }
});

$(".pageTest").on("click", "#practiseWordsButton", () => {
  showPopup();
});

ConfigEvent.subscribe((eventKey) => {
  if (eventKey === "mode") resetBefore();
});

Skeleton.save(wrapperId);
