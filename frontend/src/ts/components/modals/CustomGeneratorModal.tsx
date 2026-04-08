import { createForm } from "@tanstack/solid-form";
import { createSignal, JSXElement, Setter } from "solid-js";

import { hideModal } from "../../states/modals";
import { showNoticeNotification } from "../../states/notifications";
import { AnimatedModal } from "../common/AnimatedModal";
import { Button } from "../common/Button";
import { Separator } from "../common/Separator";
import { InputField } from "../ui/form/InputField";
import { LabeledField } from "../ui/form/LabeledField";
import { SubmitButton } from "../ui/form/SubmitButton";
import { TextareaField } from "../ui/form/TextareaField";
import SlimSelect from "../ui/SlimSelect";

type CustomTextIncomingData =
  | ({ set?: boolean; long?: boolean } & (
      | { text: string; splitText?: never }
      | { text?: never; splitText: string[] }
    ))
  | null;

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

export function CustomGeneratorModal(props: {
  setChainedData: Setter<CustomTextIncomingData>;
}): JSXElement {
  const [selectedPreset, setSelectedPreset] = createSignal(
    presetOptions[0]?.value ?? "",
  );

  let submitAction: "set" | "add" = "set";

  const form = createForm(() => ({
    defaultValues: {
      characterSet: "",
      minLength: "2",
      maxLength: "5",
      wordCount: "100",
    },
    onSubmit: ({ value }) => {
      const input = value.characterSet.trim();
      if (input === "") {
        showNoticeNotification("Character set cannot be empty");
        return;
      }

      const characters = input.split(/\s+/);
      const minLength = parseInt(value.minLength) || 2;
      const maxLength = parseInt(value.maxLength) || 5;
      const wordCount = parseInt(value.wordCount) || 100;
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

      if (generatedWords.length === 0) return;

      props.setChainedData({
        splitText: generatedWords,
        set: submitAction === "set",
      });
      hideModal("CustomGenerator");
    },
  }));

  const applyPreset = () => {
    const preset = presets[selectedPreset()];
    if (preset) {
      form.setFieldValue("characterSet", preset.characters.join(" "));
    }
  };

  return (
    <AnimatedModal id="CustomGenerator" modalClass="max-w-[600px]">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
        class="grid gap-4"
      >
        <LabeledField label="presets">
          <div class="grid grid-cols-[1fr_auto] gap-2">
            <SlimSelect
              options={presetOptions}
              selected={selectedPreset()}
              onChange={setSelectedPreset}
            />
            <Button variant="button" text="apply" onClick={applyPreset} />
          </div>
        </LabeledField>
        <Separator />
        <div class="text-xs text-sub">
          Enter characters or strings separated by spaces. Random combinations
          will be generated using these inputs.
        </div>
        <LabeledField label="character set">
          <form.Field
            name="characterSet"
            validators={{
              onChange: ({ value }) =>
                value.trim() === "" ? "required" : undefined,
            }}
          >
            {(field) => (
              <TextareaField field={field} class="min-h-25 p-2 text-text" />
            )}
          </form.Field>
        </LabeledField>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <LabeledField label="min length">
            <form.Field name="minLength">
              {(field) => <InputField field={field} type="number" />}
            </form.Field>
          </LabeledField>
          <LabeledField label="max length">
            <form.Field name="maxLength">
              {(field) => <InputField field={field} type="number" />}
            </form.Field>
          </LabeledField>
        </div>
        <LabeledField label="word count">
          <form.Field name="wordCount">
            {(field) => <InputField field={field} type="number" />}
          </form.Field>
        </LabeledField>
        <div class="text-xs text-sub">
          {
            '"Set" replaces the current custom text with generated words, "Add" appends generated words to the current custom text.'
          }
        </div>
        <div class="grid gap-2">
          <SubmitButton
            form={form}
            variant="button"
            text="set"
            class="flex-1"
            onClick={() => (submitAction = "set")}
          />
          <SubmitButton
            form={form}
            variant="button"
            text="add"
            class="flex-1"
            onClick={() => (submitAction = "add")}
          />
        </div>
      </form>
    </AnimatedModal>
  );
}
