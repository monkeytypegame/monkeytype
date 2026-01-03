import { ElementWithUtils } from "../utils/dom";
import Config from "../config";
import { currentQuote } from "../test/test-words";
import { getMode2 } from "../utils/misc";
import * as CustomText from "../test/custom-text";
import { compressToURI } from "lz-ts";
import AnimatedModal, { ShowOptions } from "../utils/animated-modal";
import { Difficulty, FunboxName } from "@monkeytype/schemas/configs";
import { Mode, Mode2 } from "@monkeytype/schemas/shared";
import { ElementWithUtils } from "../utils/dom";
import { CustomTextSettings } from "@monkeytype/schemas/results";

function getCheckboxValue(checkbox: string): boolean {
  return modal
    .getModal()
    .qsr<HTMLInputElement>(`label.${checkbox} input`)
    .isChecked() as boolean;
}

type SharedTestSettings = [
  Mode | null,
  Mode2<Mode> | null,
  CustomTextSettings | null,
  CustomTextSettings | null,
  boolean | null,
  boolean | null,
  string | null,
  Difficulty | null,
  FunboxName[] | null,
];

function updateURL(): void {
  const baseUrl = location.origin + "?testSettings=";
  const settings: SharedTestSettings = new Array(8).fill(
    null,
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
  const modalEl = modal.getModal();
  modalEl.qsr<HTMLTextAreaElement>("textarea.url").setValue(url);
  modalEl.qsr(".tooLongWarning").toggleClass("hidden", url.length <= 2000);
}

function updateSubgroups(): void {
  const modalEl = modal.getModal();
  if (getCheckboxValue("mode")) {
    modalEl.qsa(".subgroup").show();
  } else {
    modalEl.qsa(".subgroup").hide();
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

async function setup(modalEl: ElementWithUtils): Promise<void> {
  modalEl.qs("textarea.url")?.on("click", async (e) => {
    (e.target as HTMLTextAreaElement).select();
  });

  modalEl.qsa("label input").on("change", async () => {
    updateURL();
    updateSubgroups();
  });
}

const modal = new AnimatedModal({
  dialogId: "shareTestSettingsModal",
  setup,
});
