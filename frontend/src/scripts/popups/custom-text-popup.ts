import * as CustomText from "../test/custom-text";
import * as ManualRestart from "../test/manual-restart-tracker";
import * as TestLogic from "../test/test-logic";
import * as ChallengeController from "../controllers/challenge-controller";
import Config, * as UpdateConfig from "../config";
import * as Misc from "../misc";
import * as WordFilterPopup from "./word-filter-popup";
import * as Notifications from "../elements/notifications";

const wrapper = "#customTextPopupWrapper";
const popup = "#customTextPopup";
const storedPopup = "#storedCustomTextPopup";

export function show(): void {
  if ($(wrapper).hasClass("hidden")) {
    if ($(`${popup} .checkbox input`).prop("checked")) {
      $(`${popup} .inputs .randomInputFields`).removeClass("hidden");
      $(`${popup} .inputs .button.storedCustomTextPopupButton`).removeClass(
        "hidden"
      );
    } else {
      $(`${popup} .inputs .randomInputFields`).addClass("hidden");
    }
    $(wrapper)
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, 100, () => {
        let newtext = CustomText.text.join(CustomText.delimiter);
        newtext = newtext.replace(/\n /g, "\n");
        $(`${popup} textarea`).val(newtext);
        $(`${popup} .wordcount input`).val(CustomText.word);
        $(`${popup} .time input`).val(CustomText.time);
        $(`${popup} textarea`).focus();
      });
  }
  setTimeout(() => {
    $(`${popup} textarea`).focus();
  }, 150);
}

function showStored(): void {
  $(popup).addClass("hidden");
  $(storedPopup).removeClass("hidden");

  refreshStoredList();
}

function refreshStoredList(): void {
  const names = CustomText.getCustomTextNames();

  const listEl = $(`${storedPopup} .storedCustomTextList`).empty();

  if (names.length !== 0) {
    listEl.removeClass("hidden");

    let list = "";

    for (const name of names) {
      list += `<div class="storedCustomText">
      <div class="button storedCustomTextButton">${name}</div>
      <div class="button removeButton">
        <i class="fas fa-trash"></i>
      </div>
      </div>`;
    }

    listEl.html(list);
  } else {
    listEl.addClass("hidden");
  }
}

function hideStored(): void {
  if (!$(storedPopup).hasClass("hidden")) {
    $(storedPopup).addClass("hidden");

    $(popup).removeClass("hidden");
  }
}

$(`${popup} .delimiterCheck input`).change(() => {
  let delimiter;
  if ($(`${popup} .delimiterCheck input`).prop("checked")) {
    delimiter = "|";
  } else {
    delimiter = " ";
  }
  if (
    $(`${popup} textarea`).val() != CustomText.text.join(CustomText.delimiter)
  ) {
    const currentText = $(`${popup} textarea`).val() as string;
    const currentTextSplit = currentText.split(CustomText.delimiter);
    let newtext = currentTextSplit.join(delimiter);
    newtext = newtext.replace(/\n /g, "\n");
    $(`${popup} textarea`).val(newtext);
  } else {
    let newtext = CustomText.text.join(delimiter);
    newtext = newtext.replace(/\n /g, "\n");
    $(`${popup} textarea`).val(newtext);
  }
  CustomText.setDelimiter(delimiter);
});

export function hide(): void {
  if (!$(wrapper).hasClass("hidden")) {
    $(wrapper)
      .stop(true, true)
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        100,
        () => {
          $(wrapper).addClass("hidden");
        }
      );
  }
}

export function isVisible(): boolean {
  return !$(wrapper).hasClass("hidden");
}

$(wrapper).mousedown((e) => {
  if ($(e.target).attr("id") === "customTextPopupWrapper") {
    hideStored();
    hide();
  }
});

$(`${popup} .inputs .checkbox input`).change(() => {
  if ($(`${popup} .checkbox input`).prop("checked")) {
    $(`${popup} .inputs .randomInputFields`).removeClass("hidden");
  } else {
    $(`${popup} .inputs .randomInputFields`).addClass("hidden");
  }
});

$(`${popup} textarea`).keypress((e) => {
  if (e.code === "Enter" && e.ctrlKey) {
    $(`${popup} .button.apply`).click();
  }
});

$(`${popup} .randomInputFields .wordcount input`).keypress(() => {
  $(`${popup} .randomInputFields .time input`).val("");
});

$(`${popup} .randomInputFields .time input`).keypress(() => {
  $(`${popup} .randomInputFields .wordcount input`).val("");
});

function applyStored(): void {
  const text = ($(`${storedPopup} textarea`).val() as string).normalize();

  $(`${popup} textarea`).val(text);

  hideStored();
}

function apply(): void {
  let text = ($(`${popup} textarea`).val() as string).normalize();
  text = text.trim();
  // text = text.replace(/[\r]/gm, " ");
  text = text.replace(/\\\\t/gm, "\t");
  text = text.replace(/\\\\n/gm, "\n");
  text = text.replace(/\\t/gm, "\t");
  text = text.replace(/\\n/gm, "\n");
  text = text.replace(/ +/gm, " ");
  // text = text.replace(/(\r\n)+/g, "\r\n");
  // text = text.replace(/(\n)+/g, "\n");
  // text = text.replace(/(\r)+/g, "\r");
  text = text.replace(/( *(\r\n|\r|\n) *)/g, "\n ");
  if ($(`${popup} .typographyCheck input`).prop("checked")) {
    text = Misc.cleanTypographySymbols(text);
  }
  // text = Misc.remove_non_ascii(text);
  text = text.replace(/[\u2060]/g, "");
  CustomText.setText(text.split(CustomText.delimiter));
  CustomText.setWord(parseInt($(`${popup} .wordcount input`).val() as string));
  CustomText.setTime(parseInt($(`${popup} .time input`).val() as string));

  CustomText.setIsWordRandom(
    $(`${popup} .checkbox input`).prop("checked") && !isNaN(CustomText.word)
  );
  CustomText.setIsTimeRandom(
    $(`${popup} .checkbox input`).prop("checked") && !isNaN(CustomText.time)
  );

  if (
    isNaN(CustomText.word) &&
    isNaN(CustomText.time) &&
    (CustomText.isTimeRandom || CustomText.isWordRandom)
  ) {
    Notifications.add(
      "You need to specify word count or time in seconds to start a random custom test.",
      0,
      5
    );
    return;
  }

  if (
    !isNaN(CustomText.word) &&
    !isNaN(CustomText.time) &&
    (CustomText.isTimeRandom || CustomText.isWordRandom)
  ) {
    Notifications.add(
      "You need to pick between word count or time in seconds to start a random custom test.",
      0,
      5
    );
    return;
  }

  if (
    (CustomText.isWordRandom && CustomText.word === 0) ||
    (CustomText.isTimeRandom && CustomText.time === 0)
  ) {
    Notifications.add(
      "Infinite words! Make sure to use Bail Out from the command line to save your result.",
      0,
      7
    );
  }

  ChallengeController.clearActive();
  ManualRestart.set();
  if (Config.mode !== "custom") UpdateConfig.setMode("custom");
  TestLogic.restart();
  hideStored();
  hide();
}

$(document).on("click", `${popup} .button.apply`, () => {
  apply();
});

$(document).on("click", `${popup} .wordfilter`, () => {
  WordFilterPopup.show();
});

$(document).on("click", "#top .config .customText .text-button", () => {
  show();
});

$(document).on("click", `${popup} .button.storedCustomTextPopupButton`, () => {
  showStored();
});

$(document).on("click", `${storedPopup} .button.save`, () => {
  const text = ($(`${storedPopup} textarea`).val() as string).normalize();

  const name = $(`${storedPopup} input`).val() as string;

  if (!name) {
    Notifications.add("Empty name value", -1);

    return;
  }

  CustomText.setCustomText(name, text);

  $(`${storedPopup} textarea`).val("");

  $(`${storedPopup} input`).val("");

  refreshStoredList();
});

$(document).on("click", `${storedPopup} .button.apply`, () => {
  applyStored();
});

$(document).on(
  "click",
  `${storedPopup} .storedCustomTextList .storedCustomText .button.storedCustomTextButton`,
  (e) => {
    const target = $(e.currentTarget);

    const name = target.html();

    const text = CustomText.getCustomText(name).join(" ");

    $(`${storedPopup} textarea`).val(text);
  }
);

$(document).on(
  "click",
  `${storedPopup} .storedCustomTextList .storedCustomText .button.removeButton`,
  (e) => {
    const target = $(e.currentTarget);

    const name = target.siblings(".storedCustomTextButton").html();

    CustomText.deleteCustomText(name);

    refreshStoredList();
  }
);

$(document).keydown((event) => {
  if (
    event.key === "Escape" &&
    !$("#customTextPopupWrapper").hasClass("hidden")
  ) {
    hideStored();
    hide();
    event.preventDefault();
  }
});
