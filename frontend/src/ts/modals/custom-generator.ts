import * as CustomText from "../test/custom-text";
import * as Notifications from "../elements/notifications";
import AnimatedModal, {
  HideOptions,
  ShowOptions,
} from "../utils/animated-modal";

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
      "=>",
      "::",
      "//",
      "/*",
      "*/",
      "{}",
      "[]",
      "()",
      "<>",
      "!=",
      "==",
      ">=",
      "<=",
      "&&",
      "||",
      "++",
      "--",
      "+=",
      "-=",
      "*=",
      "/=",
      "->",
      ":=",
      "??",
      "?.",
      "!.",
      "..",
      ";;",
      ",,",
      "|>",
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
      "var",
      "let",
      "def",
      "fun",
      "str",
      "obj",
      "arr",
      "new",
      "try",
      "ret",
      "if(",
      "(){",
      "});",
      "===",
      "!==",
      "...",
      "/**",
      "**/",
      "```",
      "---",
    ],
  },
};

export async function show(showOptions?: ShowOptions): Promise<void> {
  void modal.show({
    ...showOptions,
  });
}

function hide(hideOptions?: HideOptions<OutgoingData>): void {
  void modal.hide({
    ...hideOptions,
  });
}

function generateWords(): string[] {
  const characterInput = $(
    "#customGeneratorModal .characterInput"
  ).val() as string;
  const minLength =
    parseInt($("#customGeneratorModal .minLengthInput").val() as string) || 2;
  const maxLength =
    parseInt($("#customGeneratorModal .maxLengthInput").val() as string) || 5;
  const wordCount =
    parseInt($("#customGeneratorModal .wordCountInput").val() as string) || 100;

  if (!characterInput || characterInput.trim() === "") {
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
    CustomText.getPipeDelimiter() ? "|" : " "
  );

  hide({
    modalChainData: {
      text: customText,
      set,
    },
  });
}

async function setup(modalEl: HTMLElement): Promise<void> {
  for (const button of modalEl.querySelectorAll(".presetButton")) {
    button.addEventListener("click", (e) => {
      const presetName = (e.target as HTMLButtonElement).dataset["preset"];
      if (
        presetName !== undefined &&
        presetName !== "" &&
        presets[presetName]
      ) {
        const preset = presets[presetName];
        $("#customGeneratorModal .characterInput").val(
          preset.characters.join(" ")
        );
      }
    });
  }

  modalEl.querySelector(".setButton")?.addEventListener("click", () => {
    void apply(true);
  });

  modalEl.querySelector(".addButton")?.addEventListener("click", () => {
    void apply(false);
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
