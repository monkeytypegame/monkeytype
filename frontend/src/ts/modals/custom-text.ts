import * as CustomText from "../test/custom-text";
import * as CustomTextState from "../states/custom-text-name";
import * as ManualRestart from "../test/manual-restart-tracker";
import * as TestLogic from "../test/test-logic";
import * as ChallengeController from "../controllers/challenge-controller";
import Config, * as UpdateConfig from "../config";
import * as Misc from "../utils/misc";
import * as WordFilterPopup from "./word-filter";
import * as Notifications from "../elements/notifications";
import * as SavedTextsPopup from "./saved-texts";
import * as SaveCustomTextPopup from "./save-custom-text";
import AnimatedModal, { ShowOptions } from "../utils/animated-modal";

const popup = "#customTextModal .modal";

type State = {
  textarea: string;
  lastSavedTextareaState: string;
  longCustomTextWarning: boolean;
  randomWordsChecked: boolean;
  randomWordInputs: {
    word: string;
    time: string;
    section: string;
  };
  pipeDelimiterChecked: boolean;
  replaceNewlines: "off" | "space" | "period";
  replaceControlCharactersChecked: boolean;
  replaceFancyTypographyChecked: boolean;

  customTextMode: "simple" | "repeat" | "random";
};

const state: State = {
  textarea: CustomText.getText().join(" "),
  lastSavedTextareaState: CustomText.getText().join(" "),
  longCustomTextWarning: false,
  randomWordsChecked: false,
  randomWordInputs: {
    word: "",
    time: "",
    section: "",
  },
  pipeDelimiterChecked: false,
  replaceNewlines: "off",
  replaceControlCharactersChecked: true,
  replaceFancyTypographyChecked: true,
  customTextMode: "simple",
};

function updateUI(): void {
  $(`${popup} .inputs .group[data-id="mode"] button`).removeClass("active");
  $(
    `${popup} .inputs .group[data-id="mode"] button[value="${state.customTextMode}"]`
  ).addClass("active");

  if (state.randomWordsChecked) {
    $(`${popup} .randomWordsCheckbox input`).prop("checked", true);
    $(`${popup} .inputs .randomInputFields`).removeClass("disabled");
  } else {
    $(`${popup} .randomWordsCheckbox input`).prop("checked", false);
    $(`${popup} .inputs .randomInputFields`).addClass("disabled");
  }

  if (state.pipeDelimiterChecked) {
    $(`${popup} .delimiterCheck input`).prop("checked", true);
  } else {
    $(`${popup} .delimiterCheck input`).prop("checked", false);
  }

  $(`${popup} .replaceNewLinesButtons .button`).removeClass("active");

  if (state.replaceNewlines !== "off") {
    $(`${popup} .inputs .replaceNewLinesButtons`).removeClass("disabled");
    $(
      `${popup} .replaceNewLinesButtons .button[data-replace-new-lines=${state.replaceNewlines}]`
    ).addClass("active");
  } else {
    $(`${popup} .inputs .replaceNewLinesButtons`).addClass("disabled");
  }

  $(`${popup} textarea`).val(state.textarea);

  if (state.pipeDelimiterChecked) {
    $(`${popup} .randomInputFields .sectioncount `).removeClass("hidden");
    state.randomWordInputs.word = "";
    $(`${popup} .randomInputFields .wordcount `).addClass("hidden");
  } else {
    state.randomWordInputs.section = "";
    $(`${popup} .randomInputFields .sectioncount `).addClass("hidden");
    $(`${popup} .randomInputFields .wordcount `).removeClass("hidden");
  }

  $(`${popup} .randomInputFields .wordcount input`).val(
    state.randomWordInputs.word
  );
  $(`${popup} .randomInputFields .time input`).val(state.randomWordInputs.time);
  $(`${popup} .randomInputFields .sectioncount input`).val(
    state.randomWordInputs.section
  );

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
}

async function beforeAnimation(
  modalEl: HTMLElement,
  modalChainData?: IncomingData
): Promise<void> {
  state.customTextMode = CustomText.getMode();

  state.longCustomTextWarning = CustomTextState.isCustomTextLong() ?? false;
  state.randomWordsChecked =
    CustomText.isSectionRandom ||
    CustomText.isTimeRandom ||
    CustomText.isWordRandom;
  state.pipeDelimiterChecked = CustomText.delimiter === "|";
  // state.replaceNewlinesChecked = false;

  if (CustomTextState.isCustomTextLong()) {
    // if we are in long custom text mode, always reset the textarea state to the current text
    state.textarea = CustomText.text.join(" ");
  }

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
  }

  state.randomWordInputs.word =
    CustomText.word === -1 ? "" : `${CustomText.word}`;
  state.randomWordInputs.time =
    CustomText.time === -1 ? "" : `${CustomText.time}`;
  state.randomWordInputs.section =
    CustomText.section === -1 ? "" : `${CustomText.section}`;

  updateUI();
}

async function afterAnimation(): Promise<void> {
  if (!CustomTextState.isCustomTextLong()) {
    $(`${popup} textarea`).trigger("focus");
  }
}

export function show(showOptions?: ShowOptions): void {
  state.textarea = state.lastSavedTextareaState;
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

  if (state.replaceControlCharactersChecked) {
    text = text.replace(/([^\\]|^)\\t/gm, "$1\t");
    text = text.replace(/([^\\]|^)\\n/gm, "$1\n");
    text = text.replace(/\\\\t/gm, "\\t");
    text = text.replace(/\\\\n/gm, "\\n");
  }

  text = text.replace(/ +/gm, " ");
  text = text.replace(/( *(\r\n|\r|\n) *)/g, "\n ");
  if (state.replaceFancyTypographyChecked) {
    text = Misc.cleanTypographySymbols(text);
  }

  if (state.replaceNewlines !== "off") {
    const periods = state.replaceNewlines === "period";
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
  return words;
}

function apply(): void {
  if (state.textarea === "") {
    Notifications.add("Text cannot be empty", 0);
    return;
  }

  state.lastSavedTextareaState = state.textarea;

  CustomText.setText(cleanUpText());

  CustomText.setWord(parseInt(state.randomWordInputs.word || "-1"));
  CustomText.setTime(parseInt(state.randomWordInputs.time || "-1"));
  CustomText.setSection(parseInt(state.randomWordInputs.section || "-1"));

  CustomText.setIsWordRandom(state.randomWordsChecked && CustomText.word > -1);
  CustomText.setIsTimeRandom(state.randomWordsChecked && CustomText.time > -1);
  CustomText.setIsSectionRandom(
    state.randomWordsChecked && CustomText.section > -1
  );
  if (
    state.randomWordsChecked &&
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
    // ($(`${popup} .randomWordsCheckbox input`).prop("checked") as boolean) &&
    state.randomWordsChecked &&
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
      CustomText.setMode(
        state.customTextMode === "simple" ? "repeat" : state.customTextMode
      );
      updateUI();
    });
  }

  modalEl
    .querySelector(".randomWordsCheckbox input")
    ?.addEventListener("change", (e) => {
      state.randomWordsChecked = (e.target as HTMLInputElement).checked;
      updateUI();
    });
  modalEl
    .querySelector(".typographyCheck input")
    ?.addEventListener("change", (e) => {
      state.replaceFancyTypographyChecked = (
        e.target as HTMLInputElement
      ).checked;
      updateUI();
    });
  modalEl
    .querySelector(".delimiterCheck input")
    ?.addEventListener("change", (e) => {
      state.pipeDelimiterChecked = (e.target as HTMLInputElement).checked;
      if (state.textarea !== CustomText.text.join(CustomText.delimiter)) {
        const currentTextSplit = state.textarea.split(CustomText.delimiter);
        let newtext = currentTextSplit.join(
          state.pipeDelimiterChecked ? "|" : " "
        );
        newtext = newtext.replace(/\n /g, "\n");
        state.textarea = newtext;
      } else {
        let newtext = CustomText.text.join(
          state.pipeDelimiterChecked ? "|" : " "
        );
        newtext = newtext.replace(/\n /g, "\n");
        state.textarea = newtext;
      }
      CustomText.setDelimiter(state.pipeDelimiterChecked ? "|" : " ");
      updateUI();
    });
  modalEl
    .querySelector(".replaceNewlineWithSpace input")
    ?.addEventListener("change", (e) => {
      const checked = (e.target as HTMLInputElement).checked;
      if (checked === false) {
        state.replaceNewlines = "off";
      } else {
        state.replaceNewlines = "space";
      }
      updateUI();
    });
  const replaceNewLinesButtons = modalEl.querySelectorAll(
    ".replaceNewLinesButtons .button"
  );
  for (const button of replaceNewLinesButtons) {
    button.addEventListener("click", (e) => {
      state.replaceNewlines = (e.target as HTMLElement).dataset[
        "replaceNewLines"
      ] as "space" | "period";
      updateUI();
    });
  }
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
    if (state.longCustomTextWarning) {
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
  modalEl
    .querySelector(".randomInputFields .wordcount input")
    ?.addEventListener("input", (e) => {
      state.randomWordInputs.time = "";
      state.randomWordInputs.word = (e.target as HTMLInputElement).value;
      state.randomWordInputs.section = "";
      updateUI();
    });
  modalEl
    .querySelector(".randomInputFields .time input")
    ?.addEventListener("input", (e) => {
      state.randomWordInputs.time = (e.target as HTMLInputElement).value;
      state.randomWordInputs.word = "";
      state.randomWordInputs.section = "";
      updateUI();
    });
  modalEl
    .querySelector(".randomInputFields .sectioncount input")
    ?.addEventListener("input", (e) => {
      state.randomWordInputs.time = "";
      state.randomWordInputs.word = "";
      state.randomWordInputs.section = (e.target as HTMLInputElement).value;
      updateUI();
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
