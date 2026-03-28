import type {
  QuoteLength,
  QuoteLengthConfig,
} from "@monkeytype/schemas/configs";
import type { Mode } from "@monkeytype/schemas/shared";

import { For, JSXElement, Show } from "solid-js";

import { setConfig, setQuoteLengthAll } from "../../config/setters";
import { getConfig } from "../../config/store";
import { restartTestEvent } from "../../events/test";
import { isAuthenticated } from "../../states/core";
import { showModal } from "../../states/modals";
import { areUnsortedArraysEqual } from "../../utils/arrays";
import { AnimatedModal } from "../common/AnimatedModal";
import { Button } from "../common/Button";
import { Separator } from "../common/Separator";

const modes: Mode[] = ["time", "words", "quote", "zen", "custom"];
const times = [15, 30, 60, 120];
const wordCounts = [10, 25, 50, 100];

const quoteLengths: {
  value: string;
  label: string;
  loginRequired?: boolean;
}[] = [
  { value: "all", label: "all" },
  { value: "0", label: "short" },
  { value: "1", label: "medium" },
  { value: "2", label: "long" },
  { value: "3", label: "thicc" },
  { value: "-3", label: "favorite", loginRequired: true },
  { value: "-2", label: "search" },
] as const;

function MCButton(props: {
  text: string;
  active?: boolean;
  disabled?: boolean;
  onClick: (e: MouseEvent) => void;
}): JSXElement {
  return (
    <Button
      variant="button"
      text={props.text}
      active={props.active}
      disabled={props.disabled}
      onClick={props.onClick}
    />
  );
}

const isPunctuationDisabled = () =>
  getConfig.mode === "quote" || getConfig.mode === "zen";

export function MobileTestConfigModal(): JSXElement {
  const handleModeClick = (mode: Mode) => {
    if (mode === getConfig.mode) return;
    setConfig("mode", mode);
    restartTestEvent.dispatch();
  };

  const handleTimeClick = (time: number | "custom") => {
    if (time === "custom") {
      showModal("TestDuration");
    } else {
      setConfig("time", time);
      restartTestEvent.dispatch();
    }
  };

  const handleWordsClick = (words: number | "custom") => {
    if (words === "custom") {
      showModal("CustomWordAmount");
    } else {
      setConfig("words", words);
      restartTestEvent.dispatch();
    }
  };

  const handleQuoteLengthClick = (value: string, e: MouseEvent) => {
    if (value === "all") {
      if (setQuoteLengthAll()) {
        restartTestEvent.dispatch();
      }
    } else if (value === "-2") {
      showModal("QuoteSearch");
    } else {
      const len = parseInt(value, 10) as QuoteLength;
      let arr: QuoteLengthConfig;

      if (e.shiftKey) {
        arr = [...getConfig.quoteLength, len];
      } else {
        arr = [len];
      }

      if (setConfig("quoteLength", arr)) {
        restartTestEvent.dispatch();
      }
    }
  };

  const isQuoteLengthActive = (value: string) => {
    if (value === "all") {
      return areUnsortedArraysEqual(getConfig.quoteLength, [0, 1, 2, 3]);
    }
    if (value === "-2") return false;
    if (value === "-3") {
      return areUnsortedArraysEqual(getConfig.quoteLength, [-3]);
    }
    return getConfig.quoteLength.includes(parseInt(value, 10) as QuoteLength);
  };

  return (
    <AnimatedModal id="MobileTestConfig" modalClass="grid gap-4">
      <div class="grid gap-2">
        <MCButton
          text="punctuation"
          active={getConfig.punctuation && !isPunctuationDisabled()}
          disabled={isPunctuationDisabled()}
          onClick={() => {
            setConfig("punctuation", !getConfig.punctuation);
            restartTestEvent.dispatch();
          }}
        />
        <MCButton
          text="numbers"
          active={getConfig.numbers && !isPunctuationDisabled()}
          disabled={isPunctuationDisabled()}
          onClick={() => {
            setConfig("numbers", !getConfig.numbers);
            restartTestEvent.dispatch();
          }}
        />
      </div>

      <Separator />

      <div class="grid gap-2">
        <For each={modes}>
          {(mode) => (
            <MCButton
              text={mode}
              active={getConfig.mode === mode}
              onClick={() => handleModeClick(mode)}
            />
          )}
        </For>
      </div>

      <Separator />

      <Show when={getConfig.mode !== "zen"}>
        <div class="grid gap-2">
          <Show when={getConfig.mode === "time"}>
            <For each={times}>
              {(time) => (
                <MCButton
                  text={String(time)}
                  active={getConfig.time === time}
                  onClick={() => handleTimeClick(time)}
                />
              )}
            </For>
            <MCButton text="custom" onClick={() => handleTimeClick("custom")} />
          </Show>

          <Show when={getConfig.mode === "words"}>
            <For each={wordCounts}>
              {(words) => (
                <MCButton
                  text={String(words)}
                  active={getConfig.words === words}
                  onClick={() => handleWordsClick(words)}
                />
              )}
            </For>
            <MCButton
              text="custom"
              onClick={() => handleWordsClick("custom")}
            />
          </Show>

          <Show when={getConfig.mode === "quote"}>
            <For each={quoteLengths}>
              {(ql) => (
                <Show when={!("loginRequired" in ql) || isAuthenticated()}>
                  <MCButton
                    text={ql.label}
                    active={isQuoteLengthActive(ql.value)}
                    onClick={(e) => handleQuoteLengthClick(ql.value, e)}
                  />
                </Show>
              )}
            </For>
          </Show>

          <Show when={getConfig.mode === "custom"}>
            <MCButton text="change" onClick={() => showModal("CustomText")} />
          </Show>
        </div>
        <Separator />
      </Show>

      <div class="grid gap-2">
        <MCButton text="share" onClick={() => showModal("ShareTestSettings")} />
      </div>
    </AnimatedModal>
  );
}
