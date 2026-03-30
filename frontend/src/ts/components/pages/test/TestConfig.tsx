import { ComponentProps, For, JSXElement, Show } from "solid-js";

import { configMetadata } from "../../../config/metadata";
import { setConfig, setQuoteLengthAll } from "../../../config/setters";
import { getConfig } from "../../../config/store";
import { restartTestEvent } from "../../../events/test";
import { createEffectOn } from "../../../hooks/effects";
import { useRefWithUtils } from "../../../hooks/useRefWithUtils";
import { isAuthenticated } from "../../../states/core";
import { showModal } from "../../../states/modals";
import { getResultVisible, getFocus } from "../../../states/test";
import { FaObject } from "../../../types/font-awesome";
import { areUnsortedArraysEqual } from "../../../utils/arrays";
import { cn } from "../../../utils/cn";
import { Anime, AnimeShow } from "../../common/anime";
import { Button } from "../../common/Button";

const variables = cn(
  "[--card-gap:0.25em] [--font-size:0.6em] [--horizontal-padding:0.4em] [--vertical-padding:0.7rem]",
  "md:[--card-gap:1em] md:[--font-size:0.7em] md:[--horizontal-padding:0.45em]",
  "lg:[--card-gap:1em] lg:[--font-size:0.75em] lg:[--horizontal-padding:0.75em]",
  "xl:[--card-gap:2em] xl:[--font-size:0.75em] xl:[--horizontal-padding:1em]",
);
const buttonClass = "px-(--horizontal-padding) py-(--vertical-padding)";
const cardClass =
  "card rounded-(--roundness) bg-sub-alt px-(--horizontal-padding)";
const durationMs = 250;

export function TestConfig(): JSXElement {
  return (
    <>
      <div
        class={cn(
          variables,
          "group relative mb-8 hidden w-max grid-cols-[1fr_auto_1fr] justify-center place-self-center [font-size:var(--font-size)] sm:grid",
          "mx-auto transition-opacity duration-125",
          getFocus() || getResultVisible()
            ? "pointer-events-none opacity-0"
            : "",
        )}
        data-ui-element="testConfig"
      >
        <PuncAndNum />
        <Mode />
        <Mode2 />
      </div>
      <Button
        class={cn("flex place-self-center px-4 py-2 text-sub sm:hidden")}
        variant="button"
        onClick={() => {
          showModal("MobileTestConfig");
        }}
        text="test settings"
        fa={{
          icon: "fa-cog",
        }}
      />
    </>
  );
}

function TCButton(props: {
  fa: FaObject;
  text: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}): JSXElement {
  return (
    <Button
      variant="text"
      class={cn(buttonClass)}
      fa={{ ...props.fa, fixedWidth: true }}
      text={props.text}
      active={props.active}
      onClick={props.onClick}
      disabled={props.disabled}
    />
  );
}

function PuncAndNum(): JSXElement {
  const buttons = ["punctuation", "numbers"] as const;

  return (
    <Anime
      class="mr-(--card-gap) w-max place-self-end"
      animation={{
        opacity: getConfig.mode === "zen" ? 0 : 1,
        // marginRight: getConfig.mode === "zen" ? "0" : "var(--card-gap)",
        duration: durationMs,
      }}
    >
      <AnimeShow when={getConfig.mode !== "zen"} duration={durationMs}>
        <div class={cardClass}>
          <For each={buttons}>
            {(configKey) => (
              <TCButton
                fa={configMetadata[configKey].fa}
                text={configMetadata[configKey].displayString ?? configKey}
                active={getConfig[configKey]}
                disabled={
                  getConfig.mode === "zen" || getConfig.mode === "quote"
                }
                onClick={() => {
                  setConfig(configKey, !getConfig[configKey]);
                  restartTestEvent.dispatch();
                }}
              />
            )}
          </For>
        </div>
      </AnimeShow>
    </Anime>
  );
}

function Mode(): JSXElement {
  const modeOptions = ["time", "words", "quote", "zen", "custom"] as const;

  return (
    <div class={cn("z-2", cardClass)}>
      <For each={modeOptions}>
        {(modeOption) => (
          <TCButton
            fa={
              configMetadata.mode.optionsMetadata?.[modeOption]?.fa ??
              configMetadata.mode.fa
            }
            text={
              configMetadata.mode.optionsMetadata?.[modeOption]
                ?.displayString ?? modeOption
            }
            active={getConfig.mode === modeOption}
            onClick={() => {
              setConfig("mode", modeOption);
              restartTestEvent.dispatch();
            }}
          />
        )}
      </For>
    </div>
  );
}

function Mode2(): JSXElement {
  const [wrapperRef, wrapperElement] = useRefWithUtils();
  const [timeRef, timeElement] = useRefWithUtils();
  const [wordsRef, wordsElement] = useRefWithUtils();
  const [quoteRef, quoteElement] = useRefWithUtils();
  const [customRef, customElement] = useRefWithUtils();

  const sClass =
    "z-2 col-start-1 row-start-1 grid w-max place-self-start grid-flow-col ml-(--card-gap)";

  const getElements = () => {
    const time = timeElement();
    const words = wordsElement();
    const quote = quoteElement();
    const custom = customElement();
    if (!time || !words || !quote || !custom) return undefined;
    return { time, words, quote, custom };
  };

  createEffectOn(
    () => getConfig.mode,
    (mode, previousMode) => {
      const wrapperEl = wrapperElement();
      const el = getElements();
      if (!wrapperEl || !el) return;

      type Mode2Key = "time" | "words" | "quote" | "custom";
      const prev = el[previousMode as Mode2Key];
      const next = el[mode as Mode2Key];

      if (previousMode === undefined) {
        for (const e of Object.values(el)) {
          e.hide();
        }
        next?.show();
        return;
      }

      prev?.show();
      const previousWidth = prev?.getOuterWidth() ?? 0;

      next?.show();
      const newWidth = next?.getOuterWidth() ?? 0;

      void wrapperEl.promiseAnimate({
        width: [previousWidth + "px", newWidth + "px"],
        duration: durationMs,
        onComplete: () => {
          wrapperEl.setStyle({
            width: "",
          });
        },
      });

      prev?.show()?.animate({
        opacity: [1, 0],
        duration: durationMs,
        onComplete: () => prev?.hide(),
      });

      next?.show()?.animate({
        opacity: [0, 1],
        duration: durationMs,
      });
    },
  );

  return (
    <div class="relative grid w-max" ref={wrapperRef}>
      <Anime
        class="grid"
        animation={{
          opacity: getConfig.mode === "zen" ? 0 : 1,
          // marginLeft:
          // getConfig.mode === "zen" ? "calc(-1*var(--card-gap))" : "0",
          duration: durationMs,
        }}
      >
        <Mode2Time class={cn(cardClass, sClass)} ref={timeRef} />
        <Mode2Words class={cn(cardClass, sClass)} ref={wordsRef} />
        <Mode2Quote class={cn(cardClass, sClass)} ref={quoteRef} />
        <Mode2Custom class={cn(cardClass, sClass)} ref={customRef} />
      </Anime>
      <Button
        variant="text"
        class={cn(
          buttonClass,
          "absolute right-0 self-center px-(--horizontal-padding) opacity-0 transition-[margin-right,background-color,opacity] duration-125 group-hover:mr-[calc((1.25em+(var(--horizontal-padding)*2))*-1)] group-hover:opacity-100 hover:mr-[calc((1.25em+(var(--horizontal-padding)*2))*-1)] hover:opacity-100",
        )}
        fa={{ icon: "fa-share", fixedWidth: true }}
        onClick={() => showModal("ShareTestSettings")}
      />
    </div>
  );
}

function Mode2Time(props: ComponentProps<"div">): JSXElement {
  const times = [15, 30, 60, 120] as const;

  return (
    <div {...props}>
      <For each={times}>
        {(time) => (
          <Button
            class={buttonClass}
            variant="text"
            text={`${time}`}
            active={getConfig.time === time}
            onClick={() => {
              setConfig("time", time);
              restartTestEvent.dispatch();
            }}
          />
        )}
      </For>
      <Button
        class={buttonClass}
        variant="text"
        active={!times.includes(getConfig.time as (typeof times)[number])}
        fa={{
          icon: "fa-tools",
          fixedWidth: true,
        }}
        onClick={() => {
          showModal("TestDuration");
        }}
      />
    </div>
  );
}

function Mode2Words(props: ComponentProps<"div">): JSXElement {
  const wordCounts = [10, 25, 50, 100] as const;

  return (
    <div {...props}>
      <For each={wordCounts}>
        {(count) => (
          <Button
            class={buttonClass}
            variant="text"
            text={`${count}`}
            active={getConfig.words === count}
            onClick={() => {
              setConfig("words", count);
              restartTestEvent.dispatch();
            }}
          />
        )}
      </For>
      <Button
        class={buttonClass}
        variant="text"
        active={
          !wordCounts.includes(getConfig.words as (typeof wordCounts)[number])
        }
        fa={{
          icon: "fa-tools",
          fixedWidth: true,
        }}
        onClick={() => {
          showModal("CustomWordAmount");
        }}
      />
    </div>
  );
}

function Mode2Quote(props: ComponentProps<"div">): JSXElement {
  const quoteLengths = [
    { text: "short", length: 0 },
    { text: "medium", length: 1 },
    { text: "long", length: 2 },
    { text: "thicc", length: 3 },
  ] as const;

  return (
    <div {...props}>
      <Button
        class={buttonClass}
        variant="text"
        text="all"
        active={areUnsortedArraysEqual(getConfig.quoteLength, [0, 1, 2, 3])}
        onClick={() => {
          setQuoteLengthAll();
          restartTestEvent.dispatch();
        }}
      />
      <For each={quoteLengths}>
        {({ text, length }) => (
          <Button
            class={buttonClass}
            variant="text"
            text={text}
            active={areUnsortedArraysEqual(getConfig.quoteLength, [length])}
            onClick={() => {
              setConfig("quoteLength", [length]);
              restartTestEvent.dispatch();
            }}
          />
        )}
      </For>
      <Show when={isAuthenticated()}>
        <Button
          class={buttonClass}
          fa={{
            icon: "fa-heart",
          }}
          variant="text"
          active={areUnsortedArraysEqual(getConfig.quoteLength, [-3])}
          onClick={() => {
            setConfig("quoteLength", [-3]);
            restartTestEvent.dispatch();
          }}
        />
      </Show>
      <Button
        class={buttonClass}
        variant="text"
        fa={{
          icon: "fa-search",
          fixedWidth: true,
        }}
        onClick={() => {
          showModal("QuoteSearch");
        }}
      />
    </div>
  );
}

function Mode2Custom(props: ComponentProps<"div">): JSXElement {
  return (
    <div {...props}>
      <Button
        class={buttonClass}
        variant="text"
        text="change"
        onClick={() => {
          showModal("CustomText");
        }}
      />
    </div>
  );
}
