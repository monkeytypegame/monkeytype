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
import * as Skeleton from "./skeleton";

const skeletonId = "customTextPopupWrapper";

const wrapper = "#customTextPopupWrapper";
const popup = "#customTextPopup";

function updateLongTextWarning(): void {
  if (CustomTextState.isCustomTextLong() === true) {
    $(`${popup} .longCustomTextWarning`).removeClass("hidden");
    $(`${popup} .randomWordsCheckbox input`).prop("checked", false);
    $(`${popup} .delimiterCheck input`).prop("checked", false);
    $(`${popup} .typographyCheck`).prop("checked", true);
    $(`${popup} .replaceNewlineWithSpace input`).prop("checked", false);
    $(`${popup} .inputs`).addClass("disabled");
  } else {
    $(`${popup} .longCustomTextWarning`).addClass("hidden");
    $(`${popup} .inputs`).removeClass("disabled");
  }
}

export function show(noAnim = false): void {
  Skeleton.append(skeletonId);
  if (!Misc.isElementVisible(wrapper)) {
    updateLongTextWarning();

    if (
      CustomText.isSectionRandom ||
      CustomText.isTimeRandom ||
      CustomText.isWordRandom
    ) {
      $(`${popup} .randomWordsCheckbox input`).prop("checked", true);
    } else {
      $(`${popup} .randomWordsCheckbox input`).prop("checked", false);
    }

    if (CustomText.delimiter === "|") {
      $(`${popup} .delimiterCheck input`).prop("checked", true);
    } else {
      $(`${popup} .delimiterCheck input`).prop("checked", false);
    }

    if ($(`${popup} .randomWordsCheckbox input`).prop("checked")) {
      $(`${popup} .inputs .randomInputFields`).removeClass("disabled");
    } else {
      $(`${popup} .inputs .randomInputFields`).addClass("disabled");
    }
    if ($(`${popup} .replaceNewlineWithSpace input`).prop("checked")) {
      $(`${popup} .inputs .replaceNewLinesButtons`).removeClass("disabled");
    } else {
      $(`${popup} .inputs .replaceNewLinesButtons`).addClass("disabled");
    }
    $(`${popup} textarea`).val(CustomText.popupTextareaState);

    $(wrapper)
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, noAnim ? 0 : 125, () => {
        $(`${popup} .wordcount input`).val(
          CustomText.word === -1 ? "" : CustomText.word
        );
        $(`${popup} .time input`).val(
          CustomText.time === -1 ? "" : CustomText.time
        );
        $(`${popup} textarea`).trigger("focus");
      });
  }
  setTimeout(
    () => {
      if (!CustomTextState.isCustomTextLong()) {
        $(`${popup} textarea`).trigger("focus");
      }
    },
    noAnim ? 10 : 150
  );
}

$(`${popup} .delimiterCheck input`).on("change", () => {
  let delimiter;
  if ($(`${popup} .delimiterCheck input`).prop("checked")) {
    delimiter = "|";

    $(`${popup} .randomInputFields .sectioncount `).removeClass("hidden");

    $(`${popup} .randomInputFields .wordcount input `).val("");
    $(`${popup} .randomInputFields .wordcount `).addClass("hidden");
  } else {
    delimiter = " ";
    $(`${popup} .randomInputFields .sectioncount input `).val("");
    $(`${popup} .randomInputFields .sectioncount `).addClass("hidden");
    $(`${popup} .randomInputFields .wordcount `).removeClass("hidden");
  }
  if (
    $(`${popup} textarea`).val() !== CustomText.text.join(CustomText.delimiter)
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

interface HideOptions {
  noAnim?: boolean | undefined;
  resetState?: boolean | undefined;
}

function hide(options = {} as HideOptions): void {
  if (options.noAnim === undefined) options.noAnim = false;
  if (options.resetState === undefined) options.resetState = true;

  if (Misc.isElementVisible(wrapper)) {
    $(wrapper)
      .stop(true, true)
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        options.noAnim ? 0 : 125,
        () => {
          if (options.resetState) {
            const newText = CustomText.text.map((word) => {
              if (word[word.length - 1] === "|") {
                word = word.slice(0, -1);
              }
              return word;
            });

            CustomText.setPopupTextareaState(
              // CustomText.text.join(CustomText.delimiter)
              newText.join(CustomText.delimiter)
            );
          }

          $(wrapper).addClass("hidden");
          Skeleton.remove(skeletonId);
        }
      );
  }
}

$(wrapper).on("mousedown", (e) => {
  if ($(e.target).attr("id") === "customTextPopupWrapper") {
    hide();
  }
});

$(`${popup} .inputs .randomWordsCheckbox input`).on("change", () => {
  if ($(`${popup} .randomWordsCheckbox input`).prop("checked")) {
    $(`${popup} .inputs .randomInputFields`).removeClass("disabled");
  } else {
    $(`${popup} .inputs .randomInputFields`).addClass("disabled");
  }
});

$(`${popup} .replaceNewlineWithSpace input`).on("change", () => {
  if ($(`${popup} .replaceNewlineWithSpace input`).prop("checked")) {
    $(`${popup} .inputs .replaceNewLinesButtons`).removeClass("disabled");
  } else {
    $(`${popup} .inputs .replaceNewLinesButtons`).addClass("disabled");
  }
});

$(`${popup} .inputs .replaceNewLinesButtons .button`).on("click", (e) => {
  $(`${popup} .inputs .replaceNewLinesButtons .button`).removeClass("active");
  $(e.target).addClass("active");
});

$(`${popup} textarea`).on("input", () => {
  CustomText.setPopupTextareaState($(`${popup} textarea`).val() as string);
});

$(`${popup} textarea`).on("keypress", (e) => {
  if (Misc.isElementVisible(`#customTextPopup .longCustomTextWarning`)) {
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
    Notifications.add("Disabled long custom text progress tracking", 0, {
      duration: 5,
    });
    updateLongTextWarning();
  }
});

$(`${popup} .randomInputFields .wordcount input`).on("keypress", () => {
  $(`${popup} .randomInputFields .time input`).val("");
  $(`${popup} .randomInputFields .sectioncount input`).val("");
});

$(`${popup} .randomInputFields .time input`).on("keypress", () => {
  $(`${popup} .randomInputFields .wordcount input`).val("");
  $(`${popup} .randomInputFields .sectioncount input`).val("");
});

$(`${popup} .randomInputFields .sectioncount input`).on("keypress", () => {
  $(`${popup} .randomInputFields .time input`).val("");
  $(`${popup} .randomInputFields .wordcount input`).val("");
});

function apply(): void {
  let text = ($(`${popup} textarea`).val() as string).normalize();

  if (text === "") {
    Notifications.add("Text cannot be empty", 0);
    return;
  }

  text = text.trim();
  // text = text.replace(/[\r]/gm, " ");

  //replace any characters that look like a space with an actual space
  text = text.replace(/[\u2000-\u200A\u202F\u205F\u00A0]/g, " ");

  //replace zero width characters
  text = text.replace(/[\u200B-\u200D\u2060\uFEFF]/g, "");

  if ($(`${popup} .replaceControlCharacters input`).prop("checked")) {
    text = text.replace(/([^\\]|^)\\t/gm, "$1\t");
    text = text.replace(/([^\\]|^)\\n/gm, "$1\n");
    text = text.replace(/\\\\t/gm, "\\t");
    text = text.replace(/\\\\n/gm, "\\n");
  }

  text = text.replace(/ +/gm, " ");
  text = text.replace(/( *(\r\n|\r|\n) *)/g, "\n ");
  if ($(`${popup} .typographyCheck input`).prop("checked")) {
    text = Misc.cleanTypographySymbols(text);
  }
  if ($(`${popup} .replaceNewlineWithSpace input`).prop("checked")) {
    let periods = true;
    if (
      $($(`${popup} .replaceNewLinesButtons .button`)[0]).hasClass("active")
    ) {
      periods = false;
    }

    if (periods) {
      text = text.replace(/\n/gm, ". ");
      text = text.replace(/\.\. /gm, ". ");
      text = text.replace(/ +/gm, " ");
    } else {
      text = text.replace(/\n/gm, " ");
      text = text.replace(/ +/gm, " ");
    }
  }

  const words = text.split(CustomText.delimiter).filter((word) => word !== "");
  CustomText.setText(words);

  CustomText.setWord(
    parseInt(($(`${popup} .wordcount input`).val() as string) || "-1")
  );
  CustomText.setTime(
    parseInt(($(`${popup} .time input`).val() as string) || "-1")
  );

  CustomText.setSection(
    parseInt(($(`${popup} .sectioncount input`).val() as string) || "-1")
  );
  CustomText.setIsWordRandom(
    $(`${popup} .randomWordsCheckbox input`).prop("checked") &&
      CustomText.word > -1
  );
  CustomText.setIsTimeRandom(
    $(`${popup} .randomWordsCheckbox input`).prop("checked") &&
      CustomText.time > -1
  );
  CustomText.setIsSectionRandom(
    $(`${popup} .randomWordsCheckbox input`).prop("checked") &&
      CustomText.section > -1
  );
  if (
    $(`${popup} .randomWordsCheckbox input`).prop("checked") &&
    !CustomText.isTimeRandom &&
    !CustomText.isWordRandom &&
    !CustomText.isSectionRandom
  ) {
    Notifications.add(
      "You need to specify word count or time in seconds to start a random custom test",
      0,
      {
        duration: 5,
      }
    );
    return;
  }

  if (
    $(`${popup} .randomWordsCheckbox input`).prop("checked") &&
    CustomText.isTimeRandom &&
    CustomText.isWordRandom
  ) {
    Notifications.add(
      "You need to pick between word count or time in seconds to start a random custom test",
      0,
      {
        duration: 5,
      }
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
      {
        duration: 7,
      }
    );
  }

  ChallengeController.clearActive();
  ManualRestart.set();
  if (Config.mode !== "custom") UpdateConfig.setMode("custom");
  TestLogic.restart();
  hide();
}

$("#popups").on("click", `${popup} .button.apply`, () => {
  apply();
});

$(".pageTest").on("click", "#testConfig .customText .textButton", () => {
  show();
});

$(document).on("keydown", (event) => {
  if (
    event.key === "Escape" &&
    Misc.isElementVisible("#customTextPopupWrapper")
  ) {
    hide();
    event.preventDefault();
  }
});

$("#popups").on("click", `${popup} .wordfilter`, () => {
  hide({ noAnim: true, resetState: false });
  WordFilterPopup.show(true, () => {
    show(true);
  });
});

$(`${popup} .buttonsTop .showSavedTexts`).on("click", () => {
  hide({ noAnim: true });
  SavedTextsPopup.show(true, () => {
    show(true);
  });
});

$(`#customTextPopupWrapper .buttonsTop .saveCustomText`).on("click", () => {
  hide({ noAnim: true, resetState: false });
  SaveCustomTextPopup.show(true, () => {
    show(true);
  });
});

$(`#customTextPopupWrapper .longCustomTextWarning .button`).on("click", () => {
  $(`#customTextPopup .longCustomTextWarning`).addClass("hidden");
});

$(`#fileInput`).on("change", () => {
  const file = ($(`#fileInput`)[0] as HTMLInputElement).files?.[0];
  if (file) {
    if (file.type !== "text/plain") {
      Notifications.add("File is not a text file", -1, {
        duration: 5,
      });
      return;
    }

    const reader = new FileReader();
    reader.readAsText(file, "UTF-8");

    reader.onload = (readerEvent): void => {
      const content = readerEvent.target?.result as string;
      $(`${popup} textarea`).val(content);
      $(`#fileInput`).val("");
    };
    reader.onerror = (): void => {
      Notifications.add("Failed to read file", -1, {
        duration: 5,
      });
    };
  }
});

Skeleton.save(skeletonId);
