import * as CustomText from "../test/custom-text";
import * as CustomTextState from "../states/custom-text-name";
import * as ManualRestart from "../test/manual-restart-tracker";
import * as TestLogic from "../test/test-logic";
import * as ChallengeController from "../controllers/challenge-controller";
import Config, * as UpdateConfig from "../config";
import * as Misc from "../utils/misc";
import * as WordFilterPopup from "./word-filter-popup";
import * as Notifications from "../elements/notifications";
import * as SavedTextsPopup from "./saved-texts-popup";
import * as SaveCustomTextPopup from "./save-custom-text-popup";

const wrapper = "#customTextPopupWrapper";
const popup = "#customTextPopup";

function updateLongTextWarning(): void {
  if (CustomTextState.isCustomTextLong() === true) {
    $(`${popup} .longCustomTextWarning`).removeClass("hidden");
  } else {
    $(`${popup} .longCustomTextWarning`).addClass("hidden");
  }
}

export function show(): void {
  if ($(wrapper).hasClass("hidden")) {
    updateLongTextWarning();
    if ($(`${popup} .checkbox input`).prop("checked")) {
      $(`${popup} .inputs .randomInputFields`).removeClass("disabled");
    } else {
      $(`${popup} .inputs .randomInputFields`).addClass("disabled");
    }
    $(wrapper)
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, 100, () => {
        let newtext = CustomText.text.join(CustomText.delimiter);
        newtext = newtext.replace(/\n /g, "\n");
        $(`${popup} textarea`).val(newtext);
        $(`${popup} .wordcount input`).val(
          CustomText.word === -1 ? "" : CustomText.word
        );
        $(`${popup} .time input`).val(
          CustomText.time === -1 ? "" : CustomText.time
        );
        $(`${popup} textarea`).trigger("focus");
      });
  }
  setTimeout(() => {
    if (!CustomTextState.isCustomTextLong()) {
      $(`${popup} textarea`).trigger("focus");
    }
  }, 150);
}

$(`${popup} .delimiterCheck input`).on("change", () => {
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

$(wrapper).on("mousedown", (e) => {
  if ($(e.target).attr("id") === "customTextPopupWrapper") {
    hide();
  }
});

$(`${popup} .inputs .checkbox input`).on("change", () => {
  if ($(`${popup} .checkbox input`).prop("checked")) {
    $(`${popup} .inputs .randomInputFields`).removeClass("disabled");
  } else {
    $(`${popup} .inputs .randomInputFields`).addClass("disabled");
  }
});

$(`${popup} textarea`).on("keypress", (e) => {
  if (!$(`${popup} .longCustomTextWarning`).hasClass("hidden")) {
    e.preventDefault();
    return;
  }
  if (e.code === "Enter" && e.ctrlKey) {
    $(`${popup} .button.apply`).trigger("click");
  }
  if (
    CustomTextState.isCustomTextLong() &&
    CustomTextState.getCustomTextName() !== ""
  ) {
    CustomTextState.setCustomTextName("", undefined);
    Notifications.add("Disabled long custom text progress tracking", 0, 5);
  }
});

$(`${popup} .randomInputFields .wordcount input`).on("keypress", () => {
  $(`${popup} .randomInputFields .time input`).val("");
});

$(`${popup} .randomInputFields .time input`).on("keypress", () => {
  $(`${popup} .randomInputFields .wordcount input`).val("");
});

$(`${popup} .buttonsTop .showSavedTexts`).on("click", () => {
  SavedTextsPopup.show();
});

$(`${popup} .buttonsTop .saveCustomText`).on("click", () => {
  hide();
});

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
  if ($(`${popup} .replaceNewlineWithSpace input`).prop("checked")) {
    text = text.replace(/\n/gm, ". ");
    text = text.replace(/\.\. /gm, ". ");
    text = text.replace(/ +/gm, " ");
  }
  // text = Misc.remove_non_ascii(text);
  text = text.replace(/[\u2060]/g, "");
  CustomText.setText(text.split(CustomText.delimiter));
  CustomText.setWord(
    parseInt($(`${popup} .wordcount input`).val() as string) || -1
  );
  CustomText.setTime(parseInt($(`${popup} .time input`).val() as string) || -1);

  CustomText.setIsWordRandom(
    $(`${popup} .checkbox input`).prop("checked") && CustomText.word > -1
  );
  CustomText.setIsTimeRandom(
    $(`${popup} .checkbox input`).prop("checked") && CustomText.time > -1
  );

  if (
    $(`${popup} .checkbox input`).prop("checked") &&
    !CustomText.isTimeRandom &&
    !CustomText.isWordRandom
  ) {
    Notifications.add(
      "You need to specify word count or time in seconds to start a random custom test",
      0,
      5
    );
    return;
  }

  if (
    $(`${popup} .checkbox input`).prop("checked") &&
    CustomText.isTimeRandom &&
    CustomText.isWordRandom
  ) {
    Notifications.add(
      "You need to pick between word count or time in seconds to start a random custom test",
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
  hide();
}

$(document).on("click", `${popup} .button.apply`, () => {
  apply();
});

$(document).on("click", `${popup} .wordfilter`, () => {
  WordFilterPopup.show();
});

$(document).on("click", "#testConfig .customText .textButton", () => {
  show();
});

$(document).on("keydown", (event) => {
  if (
    event.key === "Escape" &&
    !$("#customTextPopupWrapper").hasClass("hidden")
  ) {
    hide();
    event.preventDefault();
  }
});

$(`#customTextPopup .buttonsTop .saveCustomText`).on("click", () => {
  SaveCustomTextPopup.show();
});

$(`#customTextPopup .longCustomTextWarning .button`).on("click", () => {
  $(`#customTextPopup .longCustomTextWarning`).addClass("hidden");
});
