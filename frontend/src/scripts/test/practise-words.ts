import * as TestWords from "./test-words";
import * as Notifications from "../elements/notifications";
import Config, * as UpdateConfig from "../config";
import * as CustomText from "./custom-text";
import * as TestInput from "./test-input";
import * as ConfigEvent from "../observables/config-event";

interface Before {
  mode: MonkeyTypes.Mode | null;
  punctuation: boolean | null;
  numbers: boolean | null;
}

export const before: Before = {
  mode: null,
  punctuation: null,
  numbers: null,
};

export function init(missed: boolean, slow: boolean): void {
  if (Config.mode === "zen") return;
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
      sortableMissedWords.push([missedWord, TestInput.missedWords[missedWord]]);
    });
    sortableMissedWords.sort((a, b) => {
      return b[1] - a[1];
    });
    sortableMissedWords = sortableMissedWords.slice(0, limit);
  }

  if (missed && !slow && sortableMissedWords.length == 0) {
    Notifications.add("You haven't missed any words", 0);
    return;
  }

  let sortableSlowWords: [string, number][] = [];
  if (slow) {
    sortableSlowWords = (TestWords.words.get() as string[]).map((e, i) => [
      e,
      TestInput.burstHistory[i],
    ]);
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

  if (sortableMissedWords.length == 0 && sortableSlowWords.length == 0) {
    Notifications.add("Could not start a new custom test", 0);
    return;
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
  UpdateConfig.setMode("custom");

  CustomText.setText(newCustomText);
  CustomText.setIsWordRandom(true);
  CustomText.setWord(
    (sortableSlowWords.length + sortableMissedWords.length) * 5
  );

  before.mode = mode;
  before.punctuation = punctuation;
  before.numbers = numbers;
}

export function resetBefore(): void {
  before.mode = null;
  before.punctuation = null;
  before.numbers = null;
}

export function showPopup(focus = false): void {
  if ($("#practiseWordsPopupWrapper").hasClass("hidden")) {
    if (Config.mode === "zen") {
      Notifications.add("Practice words is unsupported in zen mode", 0);
      return;
    }
    $("#practiseWordsPopupWrapper")
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, 100, () => {
        if (focus) {
          console.log("focusing");
          $("#practiseWordsPopup .missed").trigger("focus");
        }
      });
  }
}

export function hidePopup(): void {
  if (!$("#practiseWordsPopupWrapper").hasClass("hidden")) {
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
        }
      );
  }
}

$("#practiseWordsPopupWrapper").on("click", (e) => {
  if ($(e.target).attr("id") === "practiseWordsPopupWrapper") {
    hidePopup();
  }
});

$("#practiseWordsPopup .button").on("keypress", (e) => {
  if (e.key === "Enter") {
    $(e.currentTarget).click();
  }
});

$("#practiseWordsPopup .button.both").on("focusout", (e) => {
  e.preventDefault();
  $("#practiseWordsPopup .missed").trigger("focus");
});

$(document).on("keydown", (event) => {
  if (
    event.key === "Escape" &&
    !$("#practiseWordsPopupWrapper").hasClass("hidden")
  ) {
    hidePopup();
    event.preventDefault();
  }
});

$(document).on("keypress", "#practiseWordsButton", (event) => {
  if (event.key === "Enter") {
    showPopup(true);
  }
});

$(document.body).on("click", "#practiseWordsButton", () => {
  showPopup();
});

ConfigEvent.subscribe((eventKey) => {
  if (eventKey === "mode") resetBefore();
});
