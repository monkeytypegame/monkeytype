import Config from "../config";
import { currentQuote } from "../test/test-words";
import { getMode2, isPopupVisible } from "../utils/misc";
import * as CustomText from "../test/custom-text";
import { compressToURI } from "lz-ts";
import * as Skeleton from "../utils/skeleton";

const wrapperId = "shareTestSettingsPopupWrapper";

function getCheckboxValue(checkbox: string): boolean {
  return $(`#shareTestSettingsPopupWrapper label.${checkbox} input`).prop(
    "checked"
  );
}

type SharedTestSettings = [
  SharedTypes.Config.Mode | null,
  SharedTypes.Config.Mode2<SharedTypes.Config.Mode> | null,
  SharedTypes.CustomTextData | null,
  boolean | null,
  boolean | null,
  string | null,
  SharedTypes.Config.Difficulty | null,
  string | null
];

function updateURL(): void {
  const baseUrl = location.origin + "?testSettings=";
  const settings: SharedTestSettings = [
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
  ];

  if (getCheckboxValue("mode")) {
    settings[0] = Config.mode;
  }

  if (getCheckboxValue("mode2")) {
    settings[1] = getMode2(
      Config,
      currentQuote
    ) as SharedTypes.Config.Mode2<SharedTypes.Config.Mode>;
  }

  if (getCheckboxValue("customText")) {
    settings[2] = CustomText.getData();
  }

  if (getCheckboxValue("punctuation")) {
    settings[3] = Config.punctuation;
  }

  if (getCheckboxValue("numbers")) {
    settings[4] = Config.numbers;
  }

  if (getCheckboxValue("language")) {
    settings[5] = Config.language;
  }

  if (getCheckboxValue("difficulty")) {
    settings[6] = Config.difficulty;
  }

  if (getCheckboxValue("funbox")) {
    settings[7] = Config.funbox;
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
  Skeleton.append(wrapperId, "popups");
  if (!isPopupVisible(wrapperId)) {
    updateURL();
    updateSubgroups();
    $("#shareTestSettingsPopupWrapper")
      .stop(true, true)
      .css("opacity", 0)
      .removeClass("hidden")
      .animate({ opacity: 1 }, 125);
  }
}

async function hide(): Promise<void> {
  if (isPopupVisible(wrapperId)) {
    $("#shareTestSettingsPopupWrapper")
      .stop(true, true)
      .css("opacity", 1)
      .animate(
        {
          opacity: 0,
        },
        125,
        () => {
          $("#shareTestSettingsPopupWrapper").addClass("hidden");
          Skeleton.remove(wrapperId);
        }
      );
  }
}

$(`#shareTestSettingsPopupWrapper label input`).on("change", () => {
  updateURL();
  updateSubgroups();
});

$("#shareTestSettingsPopupWrapper textarea.url").on("click", () => {
  $("#shareTestSettingsPopupWrapper textarea.url").trigger("select");
});

$("#shareTestSettingsPopupWrapper").on("mousedown", (e) => {
  if ($(e.target).attr("id") === "shareTestSettingsPopupWrapper") {
    void hide();
  }
});

$(document).on("keydown", (event) => {
  if (event.key === "Escape" && isPopupVisible(wrapperId)) {
    void hide();
    event.preventDefault();
  }
});

Skeleton.save(wrapperId);
