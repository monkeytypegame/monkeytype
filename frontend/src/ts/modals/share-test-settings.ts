import Config from "../config";
import { currentQuote } from "../test/test-words";
import { getMode2 } from "../utils/misc";
import * as CustomText from "../test/custom-text";
import { compressToURI } from "lz-ts";
import AnimatedModal, { ShowOptions } from "../utils/animated-modal";

function getCheckboxValue(checkbox: string): boolean {
  return $(`#shareTestSettingsModal label.${checkbox} input`).prop("checked");
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
  $(`#shareTestSettingsModal textarea.url`).val(url);
  if (url.length > 2000) {
    $(`#shareTestSettingsModal .tooLongWarning`).removeClass("hidden");
  } else {
    $(`#shareTestSettingsModal .tooLongWarning`).addClass("hidden");
  }
}

function updateSubgroups(): void {
  if (getCheckboxValue("mode")) {
    $(`#shareTestSettingsModal .subgroup`).removeClass("hidden");
  } else {
    $(`#shareTestSettingsModal .subgroup`).addClass("hidden");
  }
}

export function show(showOptions?: ShowOptions): void {
  void modal.show({
    ...showOptions,
    beforeAnimation: async () => {
      updateURL();
      updateSubgroups();
    },
  });
}

async function setup(modalEl: HTMLElement): Promise<void> {
  modalEl
    .querySelector("textarea.url")
    ?.addEventListener("click", async (e) => {
      (e.target as HTMLTextAreaElement).select();
    });

  const inputs = modalEl.querySelectorAll("label input");
  for (const input of inputs) {
    input.addEventListener("change", async () => {
      updateURL();
      updateSubgroups();
    });
  }
}

const modal = new AnimatedModal({
  dialogId: "shareTestSettingsModal",
  setup,
});
