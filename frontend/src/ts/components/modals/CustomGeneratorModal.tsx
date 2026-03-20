import { createSignal, JSXElement } from "solid-js";

import { setCustomTextIncomingData } from "../../states/custom-text-modal";
import { hideModal } from "../../states/modals";
import { showNoticeNotification } from "../../states/notifications";
import * as CustomText from "../../test/custom-text";
import { AnimatedModal } from "../common/AnimatedModal";
import { Button } from "../common/Button";
import SlimSelect from "../ui/SlimSelect";

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

const presetOptions = Object.entries(presets).map(([id, preset]) => ({
  value: id,
  text: preset.display,
}));

export function CustomGeneratorModal(): JSXElement {
  const [selectedPreset, setSelectedPreset] = createSignal(
    presetOptions[0]?.value ?? "",
  );
  const [characterInput, setCharacterInput] = createSignal("");
  const [minLengthInput, setMinLengthInput] = createSignal("2");
  const [maxLengthInput, setMaxLengthInput] = createSignal("5");
  const [wordCountInput, setWordCountInput] = createSignal("100");

  const applyPreset = () => {
    const preset = presets[selectedPreset()];
    if (preset) {
      setCharacterInput(preset.characters.join(" "));
    }
  };

  const generateWords = (): string[] => {
    const input = characterInput().trim();
    if (input === "") {
      showNoticeNotification("Character set cannot be empty");
      return [];
    }

    const characters = input.split(/\s+/);
    const minLength = parseInt(minLengthInput()) || 2;
    const maxLength = parseInt(maxLengthInput()) || 5;
    const wordCount = parseInt(wordCountInput()) || 100;
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
  };

  const apply = (set: boolean) => {
    const generatedWords = generateWords();
    if (generatedWords.length === 0) return;

    const customText = generatedWords.join(
      CustomText.getPipeDelimiter() ? "|" : " ",
    );
    setCustomTextIncomingData({ text: customText, set });
    hideModal("CustomGenerator");
  };

  return (
    <AnimatedModal id="CustomGenerator" modalClass="max-w-[600px]">
      <div class="grid gap-6">
        <div class="grid gap-2">
          <div class="text-sub">presets</div>
          <div class="flex gap-2">
            <div class="flex-1">
              <SlimSelect
                options={presetOptions}
                selected={selectedPreset()}
                onChange={setSelectedPreset}
              />
            </div>
            <Button variant="button" text="apply" onClick={applyPreset} />
          </div>
        </div>
        <div class="h-1 w-full rounded bg-sub-alt"></div>
        <div class="text-[0.8rem] text-sub">
          Enter characters or strings separated by spaces. Random combinations
          will be generated using these inputs.
        </div>
        <div class="grid gap-2">
          <div class="text-sub">character set</div>
          <textarea
            class="min-h-[100px] w-full resize-y rounded border-none bg-sub-alt p-2 text-text"
            autocomplete="off"
            value={characterInput()}
            onInput={(e) => setCharacterInput(e.currentTarget.value)}
          ></textarea>
        </div>
        <div class="grid grid-cols-2 gap-x-4">
          <div class="text-sub">min length</div>
          <div class="text-sub">max length</div>
          <input
            type="number"
            class="w-full"
            autocomplete="off"
            min="1"
            value={minLengthInput()}
            onInput={(e) => setMinLengthInput(e.currentTarget.value)}
          />
          <input
            type="number"
            class="w-full"
            autocomplete="off"
            min="1"
            value={maxLengthInput()}
            onInput={(e) => setMaxLengthInput(e.currentTarget.value)}
          />
        </div>
        <div class="grid gap-2">
          <div class="text-sub">word count</div>
          <input
            type="number"
            class="w-full"
            autocomplete="off"
            min="1"
            value={wordCountInput()}
            onInput={(e) => setWordCountInput(e.currentTarget.value)}
          />
        </div>
      </div>
      <div class="mt-4 grid gap-4">
        <div class="text-[0.8rem] text-sub">
          {
            '"Set" replaces the current custom text with generated words, "Add" appends generated words to the current custom text.'
          }
        </div>
        <div class="flex gap-2">
          <Button
            variant="button"
            text="set"
            class="flex-1"
            onClick={() => apply(true)}
          />
          <Button
            variant="button"
            text="add"
            class="flex-1"
            onClick={() => apply(false)}
          />
        </div>
      </div>
    </AnimatedModal>
  );
}
