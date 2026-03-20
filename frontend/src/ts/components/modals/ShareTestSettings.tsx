import type { Difficulty, FunboxName } from "@monkeytype/schemas/configs";
import type { CustomTextSettings } from "@monkeytype/schemas/results";
import type { Mode, Mode2 } from "@monkeytype/schemas/shared";

import { compressToURI } from "lz-ts";
import { createSignal, JSXElement, Show } from "solid-js";

import { getConfig } from "../../config/store";
import * as CustomText from "../../test/custom-text";
import { currentQuote } from "../../test/test-words";
import { cn } from "../../utils/cn";
import { getMode2 } from "../../utils/misc";
import { capitalizeFirstLetter } from "../../utils/strings";
import { AnimatedModal } from "../common/AnimatedModal";
import { Fa } from "../common/Fa";

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
  const [mode, setMode] = createSignal(false);
  const [mode2, setMode2] = createSignal(false);
  const [customText, setCustomText] = createSignal(false);
  const [punctuation, setPunctuation] = createSignal(false);
  const [numbers, setNumbers] = createSignal(false);
  const [language, setLanguage] = createSignal(false);
  const [difficulty, setDifficulty] = createSignal(false);
  const [funbox, setFunbox] = createSignal(false);

  const url = () => {
    const baseUrl = location.origin + "?testSettings=";
    const settings: SharedTestSettings = new Array(8).fill(
      null,
    ) as SharedTestSettings;

    const settingsMap = [
      { enabled: mode, getValue: () => getConfig.mode },
      { enabled: mode2, getValue: () => getMode2(getConfig, currentQuote) },
      { enabled: customText, getValue: () => CustomText.getData() },
      { enabled: punctuation, getValue: () => getConfig.punctuation },
      { enabled: numbers, getValue: () => getConfig.numbers },
      { enabled: language, getValue: () => getConfig.language },
      { enabled: difficulty, getValue: () => getConfig.difficulty },
      { enabled: funbox, getValue: () => getConfig.funbox },
    ];

    for (const [index, { enabled, getValue }] of settingsMap.entries()) {
      if (enabled()) {
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
      <label class="grid grid-cols-[max-content_auto] items-center gap-2">
        <input
          type="checkbox"
          checked={mode()}
          onChange={(e) => setMode(e.currentTarget.checked)}
        />
        <div>Mode</div>
        <div class="col-start-2 text-em-xs text-sub">
          {capitalizeFirstLetter(getConfig.mode)}
        </div>
      </label>

      <Show when={getConfig.mode === "custom"}>
        <label
          class={cn(
            "ml-8 grid grid-cols-[max-content_auto] items-center gap-2",
            mode() ? "" : "pointer-events-none opacity-33",
          )}
        >
          <input
            type="checkbox"
            checked={customText()}
            onChange={(e) => setCustomText(e.currentTarget.checked)}
          />
          <div>Custom text</div>
          <div class="col-start-2 text-em-xs text-sub">
            {CustomText.getData().text.length}{" "}
            {CustomText.getData().pipeDelimiter ? "sections" : "words"},{" "}
            {CustomText.getData().mode} mode, {CustomText.getData().limit.value}{" "}
            {CustomText.getData().limit.mode} limit
          </div>
        </label>
      </Show>
      <Show when={getConfig.mode !== "custom" && getConfig.mode !== "zen"}>
        <label
          class={cn(
            "ml-8 grid grid-cols-[max-content_auto] items-center gap-2",
            mode() ? "" : "pointer-events-none opacity-33",
          )}
        >
          <input
            type="checkbox"
            checked={mode2()}
            onChange={(e) => setMode2(e.currentTarget.checked)}
          />
          <div>Mode2</div>
          <div class="col-start-2 text-em-xs text-sub">{mode2subtext()}</div>
        </label>
      </Show>

      <Show when={getConfig.mode !== "zen"}>
        <label class="grid grid-cols-[max-content_auto] items-center gap-2">
          <input
            type="checkbox"
            checked={punctuation()}
            onChange={(e) => setPunctuation(e.currentTarget.checked)}
          />
          <div>Punctuation</div>
          <div class="col-start-2 text-em-xs text-sub">
            {getConfig.punctuation ? "enabled" : "disabled"}
          </div>
        </label>
        <label class="grid grid-cols-[max-content_auto] items-center gap-2">
          <input
            type="checkbox"
            checked={numbers()}
            onChange={(e) => setNumbers(e.currentTarget.checked)}
          />
          <div>Numbers</div>
          <div class="col-start-2 text-em-xs text-sub">
            {getConfig.numbers ? "enabled" : "disabled"}
          </div>
        </label>
        <label class="grid grid-cols-[max-content_auto] items-center gap-2">
          <input
            type="checkbox"
            checked={language()}
            onChange={(e) => setLanguage(e.currentTarget.checked)}
          />
          <div>Language</div>
          <div class="col-start-2 text-em-xs text-sub">
            {getConfig.language}
          </div>
        </label>
        <label class="grid grid-cols-[max-content_auto] items-center gap-2">
          <input
            type="checkbox"
            checked={difficulty()}
            onChange={(e) => setDifficulty(e.currentTarget.checked)}
          />
          <div>Difficulty</div>
          <div class="col-start-2 text-em-xs text-sub">
            {getConfig.difficulty ? "enabled" : "disabled"}
          </div>
        </label>
      </Show>
      <label class="grid grid-cols-[max-content_auto] items-center gap-2">
        <input
          type="checkbox"
          checked={funbox()}
          onChange={(e) => setFunbox(e.currentTarget.checked)}
        />
        <div>Funbox</div>
        <div class="col-start-2 text-em-xs text-sub">
          {getConfig.funbox.length > 0 ? getConfig.funbox.join(", ") : "none"}
        </div>
      </label>
      <textarea
        placeholder="url"
        value={url()}
        readOnly
        onClick={(e) => e.currentTarget.select()}
      ></textarea>
      <Show when={url().length > 2000}>
        <div class="flex place-items-center gap-2 text-xs text-error">
          <Fa icon="fa-exclamation-triangle" />
          <span>The URL is over 2000 characters long - it might not work</span>
        </div>
      </Show>
    </AnimatedModal>
  );
}
