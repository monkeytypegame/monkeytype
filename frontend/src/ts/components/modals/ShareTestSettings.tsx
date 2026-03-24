import type { Difficulty, FunboxName } from "@monkeytype/schemas/configs";
import type { CustomTextSettings } from "@monkeytype/schemas/results";
import type { Mode, Mode2 } from "@monkeytype/schemas/shared";

import { createForm } from "@tanstack/solid-form";
import { compressToURI } from "lz-ts";
import { JSXElement, Show } from "solid-js";

import { getConfig } from "../../config/store";
import { showSuccessNotification } from "../../states/notifications";
import * as CustomText from "../../test/custom-text";
import { currentQuote } from "../../test/test-words";
import { cn } from "../../utils/cn";
import { getMode2 } from "../../utils/misc";
import { capitalizeFirstLetter } from "../../utils/strings";
import { AnimatedModal } from "../common/AnimatedModal";
import { Button } from "../common/Button";
import { Fa } from "../common/Fa";
import { Checkbox } from "../ui/form/Checkbox";

type SharedTestSettings = [
  Mode | null,
  Mode2<Mode> | null,
  CustomTextSettings | null,
  boolean | null,
  boolean | null,
  string | null,
  Difficulty | null,
  FunboxName[] | null,
];

export function ShareTestSettings(): JSXElement {
  const form = createForm(() => ({
    defaultValues: {
      mode: false,
      mode2: false,
      customText: false,
      punctuation: false,
      numbers: false,
      language: false,
      difficulty: false,
      funbox: false,
    },
  }));

  const formValues = form.useStore((s) => s.values);

  const url = () => {
    const baseUrl = location.origin + "?testSettings=";
    const settings: SharedTestSettings = new Array(8).fill(
      null,
    ) as SharedTestSettings;
    const values = formValues();

    const settingsMap = [
      { enabled: values.mode, getValue: () => getConfig.mode },
      {
        enabled: values.mode2,
        getValue: () => getMode2(getConfig, currentQuote),
      },
      { enabled: values.customText, getValue: () => CustomText.getData() },
      { enabled: values.punctuation, getValue: () => getConfig.punctuation },
      { enabled: values.numbers, getValue: () => getConfig.numbers },
      { enabled: values.language, getValue: () => getConfig.language },
      { enabled: values.difficulty, getValue: () => getConfig.difficulty },
      { enabled: values.funbox, getValue: () => getConfig.funbox },
    ];

    for (const [index, { enabled, getValue }] of settingsMap.entries()) {
      if (enabled) {
        settings[index] = getValue();
      }
    }

    const compressed = compressToURI(JSON.stringify(settings));
    return baseUrl + compressed;
  };

  const mode2subtext = () => {
    let out = "";
    if (getConfig.mode === "quote") {
      out += "Quote ID ";
    }
    out += capitalizeFirstLetter(getMode2(getConfig, currentQuote) || "none");

    if (getConfig.mode === "time") {
      out += " seconds";
    }
    if (getConfig.mode === "words") {
      out += " words";
    }

    return out;
  };

  return (
    <AnimatedModal id="ShareTestSettings" title="Share test settings">
      <form.Field name="mode">
        {(field) => (
          <Checkbox
            field={() => field()}
            class="items-start"
            label={
              <div>
                <div>Mode</div>
                <div class="text-em-xs text-sub">
                  {capitalizeFirstLetter(getConfig.mode)}
                </div>
              </div>
            }
          />
        )}
      </form.Field>

      <Show when={getConfig.mode === "custom"}>
        <form.Field name="customText">
          {(field) => (
            <Checkbox
              field={() => field()}
              class={cn(
                "ml-8 items-start",
                formValues().mode ? "" : "pointer-events-none opacity-33",
              )}
              label={
                <div>
                  <div>Custom text</div>
                  <div class="text-em-xs text-sub">
                    {CustomText.getData().text.length}{" "}
                    {CustomText.getData().pipeDelimiter ? "sections" : "words"},{" "}
                    {CustomText.getData().mode} mode,{" "}
                    {CustomText.getData().limit.value}{" "}
                    {CustomText.getData().limit.mode} limit
                  </div>
                </div>
              }
            />
          )}
        </form.Field>
      </Show>
      <Show when={getConfig.mode !== "custom" && getConfig.mode !== "zen"}>
        <form.Field name="mode2">
          {(field) => (
            <Checkbox
              field={() => field()}
              class={cn(
                "ml-8 items-start",
                formValues().mode ? "" : "pointer-events-none opacity-33",
              )}
              label={
                <div>
                  <div>Mode2</div>
                  <div class="text-em-xs text-sub">{mode2subtext()}</div>
                </div>
              }
            />
          )}
        </form.Field>
      </Show>

      <Show when={getConfig.mode !== "zen"}>
        <form.Field name="punctuation">
          {(field) => (
            <Checkbox
              field={() => field()}
              class="items-start"
              label={
                <div>
                  <div>Punctuation</div>
                  <div class="text-em-xs text-sub">
                    {getConfig.punctuation ? "enabled" : "disabled"}
                  </div>
                </div>
              }
            />
          )}
        </form.Field>
        <form.Field name="numbers">
          {(field) => (
            <Checkbox
              field={() => field()}
              class="items-start"
              label={
                <div>
                  <div>Numbers</div>
                  <div class="text-em-xs text-sub">
                    {getConfig.numbers ? "enabled" : "disabled"}
                  </div>
                </div>
              }
            />
          )}
        </form.Field>
        <form.Field name="language">
          {(field) => (
            <Checkbox
              field={() => field()}
              class="items-start"
              label={
                <div>
                  <div>Language</div>
                  <div class="text-em-xs text-sub">{getConfig.language}</div>
                </div>
              }
            />
          )}
        </form.Field>
        <form.Field name="difficulty">
          {(field) => (
            <Checkbox
              field={() => field()}
              class="items-start"
              label={
                <div>
                  <div>Difficulty</div>
                  <div class="text-em-xs text-sub">{getConfig.difficulty}</div>
                </div>
              }
            />
          )}
        </form.Field>
      </Show>
      <form.Field name="funbox">
        {(field) => (
          <Checkbox
            field={() => field()}
            class="items-start"
            label={
              <div>
                <div>Funbox</div>
                <div class="text-em-xs text-sub">
                  {getConfig.funbox.length > 0
                    ? getConfig.funbox.join(", ")
                    : `none`}
                </div>
              </div>
            }
          />
        )}
      </form.Field>
      <textarea
        placeholder="url"
        value={url()}
        readOnly
        onClick={(e) => e.currentTarget.select()}
      ></textarea>
      <Button
        variant="button"
        text="copy to clipboard"
        fa={{
          icon: "fa-copy",
        }}
        onClick={() => {
          void navigator.clipboard
            .writeText(url())
            .then(() => {
              showSuccessNotification("URL copied to clipboard");
            })
            .catch((error: unknown) => {
              showSuccessNotification("Failed to copy URL", { error });
            });
        }}
      />
      <Show when={url().length > 2000}>
        <div class="flex place-items-center gap-2 text-xs text-error">
          <Fa icon="fa-exclamation-triangle" />
          <span>The URL is over 2000 characters long - it might not work</span>
        </div>
      </Show>
    </AnimatedModal>
  );
}
