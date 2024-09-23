import Config from "../config";
import { currentQuote } from "../test/test-words";
import { getMode2 } from "../utils/misc";
import * as CustomText from "../test/custom-text";
import { compressToURI } from "lz-ts";
import AnimatedModal, { ShowOptions } from "../utils/animated-modal";
import { Difficulty } from "@monkeytype/contracts/schemas/configs";
import { Mode, Mode2 } from "@monkeytype/contracts/schemas/shared";

function getCheckboxValue(checkbox: string): boolean {
  return $(`#shareTestSettingsModal label.${checkbox} input`).prop(
    "checked"
  ) as boolean;
}

type SharedTestSettings = [
  Mode | null,
  Mode2<Mode> | null,
  MonkeyTypes.CustomTextData | null,
  boolean | null,
  boolean | null,
  string | null,
  Difficulty | null,
  string | null
];

function updateURL(): void {
  const baseUrl = location.origin + "?testSettings=";
  const settings: SharedTestSettings = new Array(8).fill(
    null
  ) as SharedTestSettings;

  const settingsMap = [
    { key: "mode", getValue: () => Config.mode },
    { key: "mode2", getValue: () => getMode2(Config, currentQuote) },
    { key: "customText", getValue: () => CustomText.getData() },
    { key: "punctuation", getValue: () => Config.punctuation },
    { key: "numbers", getValue: () => Config.numbers },
    { key: "language", getValue: () => Config.language },
    { key: "difficulty", getValue: () => Config.difficulty },
    { key: "funbox", getValue: () => Config.funbox },
  ];

  for (const [index, { key, getValue }] of settingsMap.entries()) {
    if (getCheckboxValue(key)) {
      settings[index] = getValue();
    }
  }

  const compressed = compressToURI(JSON.stringify(settings));
  const url = baseUrl + compressed;

  updateShareModal(url);
}

function updateShareModal(url: string): void {
  const $modal = $(`#shareTestSettingsModal`);
  $modal.find("textarea.url").val(url);
  $modal.find(".tooLongWarning").toggleClass("hidden", url.length <= 2000);
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
