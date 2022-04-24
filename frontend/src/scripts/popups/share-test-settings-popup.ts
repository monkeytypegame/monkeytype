import Config from "../config";
import { randomQuote } from "../test/test-words";
import { getMode2 } from "../utils/misc";
import * as CustomText from "../test/custom-text";
import { compressToURI } from "lz-ts";

function getCheckboxValue(checkbox: string): boolean {
  return $(`#shareTestSettingsPopupWrapper label.${checkbox} input`).prop(
    "checked"
  );
}

function updateURL(): void {
  const baseUrl = location.origin + "?testSettings=";
  const settings: (
    | string
    | null
    | { [key: string]: string | number | boolean | string[] }
    | boolean
  )[] = [];

  if (getCheckboxValue("mode")) {
    settings[0] = Config.mode;
  } else {
    settings[0] = null;
  }

  if (getCheckboxValue("mode2")) {
    settings[1] = getMode2(
      Config,
      randomQuote
    ) as MonkeyTypes.Mode2<MonkeyTypes.Mode>;
  } else {
    settings[1] = null;
  }

  if (getCheckboxValue("customText")) {
    settings[2] = {
      text: CustomText.text.join(" "),
      isWordRandom: CustomText.isWordRandom,
      isTimeRandom: CustomText.isTimeRandom,
      word: CustomText.word,
      time: CustomText.time,
      delimiter: CustomText.delimiter,
    };
  } else {
    settings[2] = null;
  }

  if (getCheckboxValue("punctuation")) {
    settings[3] = Config.punctuation;
  } else {
    settings[3] = null;
  }

  if (getCheckboxValue("numbers")) {
    settings[4] = Config.numbers;
  } else {
    settings[4] = null;
  }

  if (getCheckboxValue("language")) {
    settings[5] = Config.language;
  } else {
    settings[5] = null;
  }

  if (getCheckboxValue("difficulty")) {
    settings[6] = Config.difficulty;
  } else {
    settings[6] = null;
  }

  if (getCheckboxValue("funbox")) {
    settings[7] = Config.funbox;
  } else {
    settings[7] = null;
  }

  const compressed = compressToURI(JSON.stringify(settings));

  const url = baseUrl + compressed;
  $(`#shareTestSettingsPopupWrapper textarea.url`).val(url);
  if (url.length > 2000) {
    $(`#shareTestSettingsPopupWrapper .tooLongWarning`).removeClass("hidden");
  } else {
    $(`#shareTestSettingsPopupWrapper .tooLongWarning`).addClass("hidden");
  }
}

function updateSubgroups(): void {
  if (getCheckboxValue("mode")) {
    $(`#shareTestSettingsPopupWrapper .subgroup`).removeClass("hidden");
  } else {
    $(`#shareTestSettingsPopupWrapper .subgroup`).addClass("hidden");
  }
}

export function show(): void {
  if ($("#shareTestSettingsPopupWrapper").hasClass("hidden")) {
    updateURL();
    updateSubgroups();
    $("#shareTestSettingsPopupWrapper")
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, 100);
  }
}

export async function hide(): Promise<void> {
  if (!$("#shareTestSettingsPopupWrapper").hasClass("hidden")) {
    $("#shareTestSettingsPopupWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        100,
        () => {
          $("#shareTestSettingsPopupWrapper").addClass("hidden");
        }
      );
  }
}

$(`#shareTestSettingsPopupWrapper label input`).on("change", () => {
  updateURL();
  updateSubgroups();
});

$("#shareTestSettingsPopupWrapper").on("mousedown", (e) => {
  if ($(e.target).attr("id") === "shareTestSettingsPopupWrapper") {
    hide();
  }
});

$(document).on("keydown", (event) => {
  if (
    event.key === "Escape" &&
    !$("#shareTestSettingsPopupWrapper").hasClass("hidden")
  ) {
    hide();
    event.preventDefault();
  }
});
