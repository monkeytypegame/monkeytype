import * as CustomText from "../test/custom-text";
import * as Notifications from "../elements/notifications";
import SlimSelect from "slim-select";
import AnimatedModal, {
  HideOptions,
  ShowOptions,
} from "../utils/animated-modal";
import { ElementWithUtils } from "../utils/dom";

type Preset = {
  display: string;
  characters: string[];
};

const presets: Record<string, Preset> = {
  alphas: {
    display: "a-z",
    characters: "abcdefghijklmnopqrstuvwxyz".split(""),
  },
  numbers: {
    display: "0-9",
    characters: "0123456789".split(""),
  },
  special: {
    display: "symbols",
    characters: "!@#$%^&*()_+-=[]{}|;:',.<>?/`~".split(""),
  },
  bigrams: {
    display: "bigrams",
    characters: [
      "th",
      "he",
      "in",
      "er",
      "an",
      "re",
      "on",
      "at",
      "en",
      "nd",
      "ed",
      "es",
      "or",
      "te",
      "st",
      "ar",
      "ou",
      "it",
      "al",
      "as",
    ],
  },
  trigrams: {
    display: "trigrams",
    characters: [
      "the",
      "and",
      "ing",
      "ion",
      "tio",
      "ent",
      "ati",
      "for",
      "her",
      "ter",
      "ate",
      "ver",
      "all",
      "con",
      "res",
      "are",
      "rea",
      "int",
    ],
  },
};

let _presetSelect: SlimSelect | undefined = undefined;

export async function show(showOptions?: ShowOptions): Promise<void> {
  void modal.show({
    ...showOptions,
    beforeAnimation: async (modalEl) => {
      _presetSelect = new SlimSelect({
        select: "#customGeneratorModal .presetInput",
        settings: {
          contentLocation: modalEl.native,
        },
      });
    },
  });
}

function applyPreset(): void {
  const modalEl = modal.getModal();
  const presetName = modalEl
    .qs<HTMLSelectElement>("select.presetInput")
    ?.getValue();

  if (presetName !== undefined && presetName !== "" && presets[presetName]) {
    const preset = presets[presetName];
    modalEl
      .qsr<HTMLInputElement>(".characterInput")
      .setValue(preset.characters.join(" "));
  }
}

function hide(hideOptions?: HideOptions<OutgoingData>): void {
  void modal.hide({
    ...hideOptions,
  });
}

function generateWords(): string[] {
  const modalEl = modal.getModal();
  const characterInput = modalEl
    .qs<HTMLInputElement>(".characterInput")
    ?.getValue();

  const minLength =
    parseInt(
      modalEl.qs<HTMLInputElement>(".minLengthInput")?.getValue() as string,
    ) || 2;
  const maxLength =
    parseInt(
      modalEl.qs<HTMLInputElement>(".maxLengthInput")?.getValue() as string,
    ) || 5;
  const wordCount =
    parseInt(
      modalEl.qs<HTMLInputElement>(".wordCountInput")?.getValue() as string,
    ) || 100;

  if (characterInput === undefined || characterInput.trim() === "") {
    Notifications.add("Character set cannot be empty", 0);
    return [];
  }

  const characters = characterInput.trim().split(/\s+/);
  const generatedWords: string[] = [];

  for (let i = 0; i < wordCount; i++) {
    const wordLength =
      Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;
    let word = "";

    for (let j = 0; j < wordLength; j++) {
      const randomChar =
        characters[Math.floor(Math.random() * characters.length)];
      word += randomChar;
    }

    generatedWords.push(word);
  }

  return generatedWords;
}

async function apply(set: boolean): Promise<void> {
  const generatedWords = generateWords();

  if (generatedWords.length === 0) {
    return;
  }

  const customText = generatedWords.join(
    CustomText.getPipeDelimiter() ? "|" : " ",
  );

  hide({
    modalChainData: {
      text: customText,
      set,
    },
  });
}

async function setup(modalEl: ElementWithUtils): Promise<void> {
  modalEl.qs(".setButton")?.on("click", () => {
    void apply(true);
  });

  modalEl.qs(".addButton")?.on("click", () => {
    void apply(false);
  });

  modalEl.qs(".generateButton")?.on("click", () => {
    applyPreset();
  });
}

type OutgoingData = {
  text: string;
  set: boolean;
};

const modal = new AnimatedModal<unknown, OutgoingData>({
  dialogId: "customGeneratorModal",
  setup,
});
