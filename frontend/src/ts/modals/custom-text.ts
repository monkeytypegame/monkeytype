import * as CustomText from "../test/custom-text";
import * as CustomTextState from "../states/custom-text-name";
import * as ManualRestart from "../test/manual-restart-tracker";
import * as TestLogic from "../test/test-logic";
import * as ChallengeController from "../controllers/challenge-controller";
import Config, * as UpdateConfig from "../config";
import * as Strings from "../utils/strings";
import * as WordFilterPopup from "./word-filter";
import * as Notifications from "../elements/notifications";
import * as SavedTextsPopup from "./saved-texts";
import * as SaveCustomTextPopup from "./save-custom-text";
import AnimatedModal, { ShowOptions } from "../utils/animated-modal";
import { CustomTextMode } from "@monkeytype/contracts/schemas/util";

const popup = "#customTextModal .modal";

type State = {
  textarea: string;
  longCustomTextWarning: boolean;
  challengeWarning: boolean;

  customTextMode: "simple" | CustomTextMode;
  customTextLimits: {
    word: string;
    time: string;
    section: string;
  };
  removeFancyTypographyEnabled: boolean;
  replaceControlCharactersEnabled: boolean;
  customTextPipeDelimiter: boolean;
  replaceNewlines: "off" | "space" | "periodSpace";
};

const state: State = {
  textarea: CustomText.getText().join(
    CustomText.getPipeDelimiter() ? "|" : " "
  ),
  longCustomTextWarning: false,
  challengeWarning: false,
  customTextMode: "simple",
  customTextLimits: {
    word: "",
    time: "",
    section: "",
  },
  removeFancyTypographyEnabled: true,
  replaceControlCharactersEnabled: true,
  customTextPipeDelimiter: false,
  replaceNewlines: "off",
};

function updateUI(): void {
  $(`${popup} .inputs .group[data-id="mode"] button`).removeClass("active");
  $(
    `${popup} .inputs .group[data-id="mode"] button[value="${state.customTextMode}"]`
  ).addClass("active");

  $(`${popup} .inputs .group[data-id="limit"] input.words`).addClass("hidden");
  $(`${popup} .inputs .group[data-id="limit"] input.sections`).addClass(
    "hidden"
  );

  $(`${popup} .inputs .group[data-id="limit"] input.words`).val(
    state.customTextLimits.word
  );
  $(`${popup} .inputs .group[data-id="limit"] input.time`).val(
    state.customTextLimits.time
  );
  $(`${popup} .inputs .group[data-id="limit"] input.sections`).val(
    state.customTextLimits.section
  );
  if (state.customTextLimits.word !== "") {
    $(`${popup} .inputs .group[data-id="limit"] input.words`).removeClass(
      "hidden"
    );
  }
  if (state.customTextLimits.section !== "") {
    $(`${popup} .inputs .group[data-id="limit"] input.sections`).removeClass(
      "hidden"
    );
  }

  if (state.customTextPipeDelimiter) {
    $(`${popup} .inputs .group[data-id="limit"] input.sections`).removeClass(
      "hidden"
    );
    $(`${popup} .inputs .group[data-id="limit"] input.words`).addClass(
      "hidden"
    );
  } else {
    $(`${popup} .inputs .group[data-id="limit"] input.words`).removeClass(
      "hidden"
    );
    $(`${popup} .inputs .group[data-id="limit"] input.sections`).addClass(
      "hidden"
    );
  }

  if (state.customTextMode === "simple") {
    $(`${popup} .inputs .group[data-id="limit"]`).addClass("disabled");
    $(`${popup} .inputs .group[data-id="limit"] input`).val("");
    $(`${popup} .inputs .group[data-id="limit"] input`).prop("disabled", true);
  } else {
    $(`${popup} .inputs .group[data-id="limit"]`).removeClass("disabled");
    $(`${popup} .inputs .group[data-id="limit"] input`).prop("disabled", false);
  }

  $(`${popup} .inputs .group[data-id="fancy"] button`).removeClass("active");
  $(
    `${popup} .inputs .group[data-id="fancy"] button[value="${state.removeFancyTypographyEnabled}"]`
  ).addClass("active");

  $(`${popup} .inputs .group[data-id="control"] button`).removeClass("active");
  $(
    `${popup} .inputs .group[data-id="control"] button[value="${state.replaceControlCharactersEnabled}"]`
  ).addClass("active");

  $(`${popup} .inputs .group[data-id="delimiter"] button`).removeClass(
    "active"
  );
  $(
    `${popup} .inputs .group[data-id="delimiter"] button[value="${state.customTextPipeDelimiter}"]`
  ).addClass("active");

  $(`${popup} .inputs .group[data-id="newlines"] button`).removeClass("active");
  $(
    `${popup} .inputs .group[data-id="newlines"] button[value="${state.replaceNewlines}"]`
  ).addClass("active");

  $(`${popup} textarea`).val(state.textarea);

  if (state.longCustomTextWarning) {
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

  if (state.challengeWarning) {
    $(`${popup} .challengeWarning`).removeClass("hidden");
    $(`${popup} .randomWordsCheckbox input`).prop("checked", false);
    $(`${popup} .delimiterCheck input`).prop("checked", false);
    $(`${popup} .typographyCheck`).prop("checked", true);
    $(`${popup} .replaceNewlineWithSpace input`).prop("checked", false);
    $(`${popup} .inputs`).addClass("disabled");
  } else {
    $(`${popup} .challengeWarning`).addClass("hidden");
    $(`${popup} .inputs`).removeClass("disabled");
  }
}

async function beforeAnimation(
  modalEl: HTMLElement,
  modalChainData?: IncomingData
): Promise<void> {
  state.customTextMode = CustomText.getMode();

  if (
    state.customTextMode === "repeat" &&
    CustomText.getLimitMode() === "word" &&
    CustomText.getLimitValue() === CustomText.getText().length
  ) {
    state.customTextMode = "simple";
  }

  state.customTextLimits.word = "";
  state.customTextLimits.time = "";
  state.customTextLimits.section = "";
  if (CustomText.getLimitMode() === "word") {
    state.customTextLimits.word = `${CustomText.getLimitValue()}`;
  } else if (CustomText.getLimitMode() === "time") {
    state.customTextLimits.time = `${CustomText.getLimitValue()}`;
  } else if (CustomText.getLimitMode() === "section") {
    state.customTextLimits.section = `${CustomText.getLimitValue()}`;
  }
  state.customTextPipeDelimiter = CustomText.getPipeDelimiter();

  state.longCustomTextWarning = CustomTextState.isCustomTextLong() ?? false;

  if (modalChainData?.text !== undefined) {
    if (modalChainData.long !== true && CustomTextState.isCustomTextLong()) {
      CustomTextState.setCustomTextName("", undefined);
      Notifications.add("Disabled long custom text progress tracking", 0, {
        duration: 5,
      });
      state.longCustomTextWarning = false;
    }

    const newText =
      modalChainData.set ?? true
        ? modalChainData.text
        : state.textarea + " " + modalChainData.text;
    state.textarea = newText;
    state.customTextMode = "simple";
    state.customTextLimits.word = `${cleanUpText().length}`;
    state.customTextLimits.time = "";
    state.customTextLimits.section = "";
  }

  updateUI();
}

async function afterAnimation(): Promise<void> {
  if (!state.challengeWarning && !state.longCustomTextWarning) {
    $(`${popup} textarea`).trigger("focus");
  }
}

export function show(showOptions?: ShowOptions): void {
  state.textarea = CustomText.getText().join(
    CustomText.getPipeDelimiter() ? "|" : " "
  );
  void modal.show({
    ...(showOptions as ShowOptions<IncomingData>),
    beforeAnimation,
    afterAnimation,
  });
}

function hide(): void {
  void modal.hide();
}

function handleFileOpen(): void {
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
      state.textarea = content;
      updateUI();
      $(`#fileInput`).val("");
    };
    reader.onerror = (): void => {
      Notifications.add("Failed to read file", -1, {
        duration: 5,
      });
    };
  }
}

function cleanUpText(): string[] {
  let text = state.textarea;

  if (text === "") return [];

  text = text.normalize().trim();
  // text = text.replace(/[\r]/gm, " ");

  //replace any characters that look like a space with an actual space
  text = text.replace(/[\u2000-\u200A\u202F\u205F\u00A0]/g, " ");

  //replace zero width characters
  text = text.replace(/[\u200B-\u200D\u2060\uFEFF]/g, "");

  if (state.replaceControlCharactersEnabled) {
    text = text.replace(/([^\\]|^)\\t/gm, "$1\t");
    text = text.replace(/\\n/g, " \n");
    text = text.replace(/([^\\]|^)\\n/gm, "$1\n");
    text = text.replace(/\\\\t/gm, "\\t");
    text = text.replace(/\\\\n/gm, "\\n");
  }

  text = text.replace(/ +/gm, " ");
  text = text.replace(/( *(\r\n|\r|\n) *)/g, "\n ");
  if (state.removeFancyTypographyEnabled) {
    text = Strings.cleanTypographySymbols(text);
  }

  if (state.replaceNewlines !== "off") {
    const periods = state.replaceNewlines === "periodSpace";
    if (periods) {
      text = text.replace(/\n/gm, ". ");
      text = text.replace(/\.\. /gm, ". ");
      text = text.replace(/ +/gm, " ");
    } else {
      text = text.replace(/\n/gm, " ");
      text = text.replace(/ +/gm, " ");
    }
  }

  const words = text
    .split(state.customTextPipeDelimiter ? "|" : " ")
    .filter((word) => word !== "");
  return words;
}

function apply(): void {
  if (state.textarea === "") {
    Notifications.add("Text cannot be empty", 0);
    return;
  }

  if (
    [
      state.customTextLimits.word,
      state.customTextLimits.time,
      state.customTextLimits.section,
    ].filter((limit) => limit !== "").length > 1
  ) {
    Notifications.add("You can only specify one limit", 0, {
      duration: 5,
    });
    return;
  }

  if (
    state.customTextMode !== "simple" &&
    state.customTextLimits.word === "" &&
    state.customTextLimits.time === "" &&
    state.customTextLimits.section === ""
  ) {
    Notifications.add("You need to specify a limit", 0, {
      duration: 5,
    });
    return;
  }

  if (
    state.customTextLimits.section === "0" ||
    state.customTextLimits.word === "0" ||
    state.customTextLimits.time === "0"
  ) {
    Notifications.add(
      "Infinite test! Make sure to use Bail Out from the command line to save your result.",
      0,
      {
        duration: 7,
      }
    );
  }

  const text = cleanUpText();

  if (state.customTextMode === "simple") {
    CustomText.setMode("repeat");
    state.customTextLimits.word = `${text.length}`;
    state.customTextLimits.time = "";
    state.customTextLimits.section = "";
  } else {
    CustomText.setMode(state.customTextMode);
  }

  CustomText.setPipeDelimiter(state.customTextPipeDelimiter);
  CustomText.setText(text);

  if (state.customTextLimits.word !== "") {
    CustomText.setLimitMode("word");
    CustomText.setLimitValue(parseInt(state.customTextLimits.word));
  } else if (state.customTextLimits.time !== "") {
    CustomText.setLimitMode("time");
    CustomText.setLimitValue(parseInt(state.customTextLimits.time));
  } else if (state.customTextLimits.section !== "") {
    CustomText.setLimitMode("section");
    CustomText.setLimitValue(parseInt(state.customTextLimits.section));
  }

  ChallengeController.clearActive();
  ManualRestart.set();
  if (Config.mode !== "custom") UpdateConfig.setMode("custom");
  TestLogic.restart();
  hide();
}

function handleDelimiterChange(): void {
  let newtext = state.textarea
    .split(state.customTextPipeDelimiter ? " " : "|")
    .join(state.customTextPipeDelimiter ? "|" : " ");
  newtext = newtext.replace(/\n /g, "\n");
  state.textarea = newtext;
}

async function setup(modalEl: HTMLElement): Promise<void> {
  modalEl
    .querySelector("#fileInput")
    ?.addEventListener("change", handleFileOpen);

  const buttons = modalEl.querySelectorAll(".group[data-id='mode'] button");
  for (const button of buttons) {
    button.addEventListener("click", (e) => {
      state.customTextMode = (e.target as HTMLButtonElement).value as
        | "simple"
        | "repeat"
        | "random";
      if (state.customTextMode === "simple") {
        const text = cleanUpText();
        state.customTextLimits.word = `${text.length}`;
        state.customTextLimits.time = "";
        state.customTextLimits.section = "";
      }
      updateUI();
    });
  }

  for (const button of modalEl.querySelectorAll(
    ".group[data-id='fancy'] button"
  )) {
    button.addEventListener("click", (e) => {
      state.removeFancyTypographyEnabled =
        (e.target as HTMLButtonElement).value === "true" ? true : false;
      updateUI();
    });
  }

  for (const button of modalEl.querySelectorAll(
    ".group[data-id='control'] button"
  )) {
    button.addEventListener("click", (e) => {
      state.replaceControlCharactersEnabled =
        (e.target as HTMLButtonElement).value === "true" ? true : false;
      updateUI();
    });
  }

  for (const button of modalEl.querySelectorAll(
    ".group[data-id='delimiter'] button"
  )) {
    button.addEventListener("click", (e) => {
      state.customTextPipeDelimiter =
        (e.target as HTMLButtonElement).value === "true" ? true : false;
      if (state.customTextPipeDelimiter && state.customTextLimits.word !== "") {
        state.customTextLimits.word = "";
      }
      if (
        !state.customTextPipeDelimiter &&
        state.customTextLimits.section !== ""
      ) {
        state.customTextLimits.section = "";
      }
      handleDelimiterChange();
      updateUI();
    });
  }

  for (const button of modalEl.querySelectorAll(
    ".group[data-id='newlines'] button"
  )) {
    button.addEventListener("click", (e) => {
      state.replaceNewlines = (e.target as HTMLButtonElement).value as
        | "off"
        | "space"
        | "periodSpace";
      updateUI();
    });
  }

  modalEl
    .querySelector(".group[data-id='limit'] input.words")
    ?.addEventListener("input", (e) => {
      state.customTextLimits.word = (e.target as HTMLInputElement).value;
      state.customTextLimits.time = "";
      state.customTextLimits.section = "";
      updateUI();
    });

  modalEl
    .querySelector(".group[data-id='limit'] input.time")
    ?.addEventListener("input", (e) => {
      state.customTextLimits.time = (e.target as HTMLInputElement).value;
      state.customTextLimits.word = "";
      state.customTextLimits.section = "";
      updateUI();
    });

  modalEl
    .querySelector(".group[data-id='limit'] input.sections")
    ?.addEventListener("input", (e) => {
      state.customTextLimits.section = (e.target as HTMLInputElement).value;
      state.customTextLimits.word = "";
      state.customTextLimits.time = "";
      updateUI();
    });

  const textarea = modalEl.querySelector("textarea");
  textarea?.addEventListener("input", (e) => {
    state.textarea = (e.target as HTMLTextAreaElement).value;
  });
  textarea?.addEventListener("keydown", (e) => {
    if (e.key !== "Tab") return;
    e.preventDefault();

    const area = e.target as HTMLTextAreaElement;
    const start: number = area.selectionStart;
    const end: number = area.selectionEnd;

    // set textarea value to: text before caret + tab + text after caret
    area.value =
      area.value.substring(0, start) + "\t" + area.value.substring(end);

    // put caret at right position again
    area.selectionStart = area.selectionEnd = start + 1;

    state.textarea = area.value;
  });
  textarea?.addEventListener("keypress", (e) => {
    if (state.longCustomTextWarning || state.challengeWarning) {
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
      state.longCustomTextWarning = false;
      Notifications.add("Disabled long custom text progress tracking", 0, {
        duration: 5,
      });
    }
  });
  modalEl.querySelector(".button.apply")?.addEventListener("click", () => {
    apply();
  });
  modalEl.querySelector(".button.wordfilter")?.addEventListener("click", () => {
    void WordFilterPopup.show({
      modalChain: modal as AnimatedModal<unknown, unknown>,
    });
  });
  modalEl
    .querySelector(".button.showSavedTexts")
    ?.addEventListener("click", () => {
      void SavedTextsPopup.show({
        modalChain: modal as AnimatedModal<unknown, unknown>,
      });
    });
  modalEl
    .querySelector(".button.saveCustomText")
    ?.addEventListener("click", () => {
      void SaveCustomTextPopup.show({
        modalChain: modal as AnimatedModal<unknown, unknown>,
        modalChainData: { text: cleanUpText() },
      });
    });
  modalEl
    .querySelector(".longCustomTextWarning")
    ?.addEventListener("click", () => {
      state.longCustomTextWarning = false;
      updateUI();
    });
  modalEl.querySelector(".challengeWarning")?.addEventListener("click", () => {
    state.challengeWarning = false;
    updateUI();
  });
}

type IncomingData = {
  text: string;
  set?: boolean;
  long?: boolean;
};

const modal = new AnimatedModal<IncomingData>({
  dialogId: "customTextModal",
  setup,
  customEscapeHandler: async (): Promise<void> => {
    hide();
  },
  customWrapperClickHandler: async (): Promise<void> => {
    hide();
  },
  showOptionsWhenInChain: {
    beforeAnimation,
    afterAnimation,
  },
});
