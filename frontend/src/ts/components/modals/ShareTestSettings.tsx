import type { Difficulty, FunboxName } from "@monkeytype/schemas/configs";
import type { CustomTextSettings } from "@monkeytype/schemas/results";
import type { Mode, Mode2 } from "@monkeytype/schemas/shared";

import { compressToURI } from "lz-ts";
import { createSignal, JSXElement, Show } from "solid-js";

import { getConfig } from "../../config/store";
import * as CustomText from "../../test/custom-text";
import { currentQuote } from "../../test/test-words";
import { getMode2 } from "../../utils/misc";
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

  return (
    <AnimatedModal id="ShareTestSettings" title="Share test settings">
      <label class="checkboxWithSub">
        <input
          type="checkbox"
          checked={mode()}
          onChange={(e) => setMode(e.currentTarget.checked)}
        />
        <div>Mode</div>
        <div class="sub">Time, Words, Quote, Zen, Custom</div>
      </label>
      <Show when={mode()}>
        <label class="checkboxWithSub">
          <input
            type="checkbox"
            checked={mode2()}
            onChange={(e) => setMode2(e.currentTarget.checked)}
          />
          <div>Mode2</div>
          <div class="sub">Test seconds, Test words, Quote Id</div>
        </label>
        <label class="checkbox">
          <input
            type="checkbox"
            checked={customText()}
            onChange={(e) => setCustomText(e.currentTarget.checked)}
          />
          Custom text
        </label>
      </Show>
      <label class="checkbox">
        <input
          type="checkbox"
          checked={punctuation()}
          onChange={(e) => setPunctuation(e.currentTarget.checked)}
        />
        Punctuation
      </label>
      <label class="checkbox">
        <input
          type="checkbox"
          checked={numbers()}
          onChange={(e) => setNumbers(e.currentTarget.checked)}
        />
        Numbers
      </label>
      <label class="checkbox">
        <input
          type="checkbox"
          checked={language()}
          onChange={(e) => setLanguage(e.currentTarget.checked)}
        />
        Language
      </label>
      <label class="checkbox">
        <input
          type="checkbox"
          checked={difficulty()}
          onChange={(e) => setDifficulty(e.currentTarget.checked)}
        />
        Difficulty
      </label>
      <label class="checkbox">
        <input
          type="checkbox"
          checked={funbox()}
          onChange={(e) => setFunbox(e.currentTarget.checked)}
        />
        Funbox
      </label>
      <textarea
        class="url"
        placeholder="url"
        value={url()}
        readOnly
        onClick={(e) => e.currentTarget.select()}
      ></textarea>
      <Show when={url().length > 2000}>
        <div class="tooLongWarning">
          <Fa icon="fa-exclamation-triangle" />
          <span>The URL is over 2000 characters long - it might not work</span>
        </div>
      </Show>
    </AnimatedModal>
  );
}
