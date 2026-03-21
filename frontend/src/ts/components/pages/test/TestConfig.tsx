import { ComponentProps, JSXElement, onMount } from "solid-js";

import { setConfig, setQuoteLengthAll } from "../../../config/setters";
import { getConfig } from "../../../config/store";
import { createEffectOn } from "../../../hooks/effects";
import { useRefWithUtils } from "../../../hooks/useRefWithUtils";
import { restartTestEvent } from "../../../states/core";
import { showModal } from "../../../states/modals";
import { showErrorNotification } from "../../../states/notifications";
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
const cardClass = "rounded bg-sub-alt px-(--horizontal-padding)";
const durationMs = 250;

export function TestConfig(): JSXElement {
  return (
    <div
      class={cn(
        variables,
        "group relative mb-8 hidden w-max grid-cols-[1fr_auto_1fr] justify-center place-self-center [font-size:var(--font-size)] sm:grid",
      )}
    >
      <PuncAndNum />
      <Mode />
      <Mode2 />
    </div>
  );
}

function PuncAndNum(): JSXElement {
  return (
    <Anime
      class="mr-(--card-gap) w-max place-self-end"
      animation={{
        opacity: getConfig.mode === "zen" ? 0 : 1,
        marginRight: getConfig.mode === "zen" ? "0" : "var(--card-gap)",
        duration: durationMs,
      }}
    >
      <AnimeShow when={getConfig.mode !== "zen"} duration={durationMs}>
        <div class={cardClass}>
          <Button
            class={buttonClass}
            variant="text"
            fa={{
              icon: "fa-at",
              fixedWidth: true,
            }}
            text="punctuation"
            active={getConfig.punctuation}
            disabled={getConfig.mode === "zen" || getConfig.mode === "quote"}
            onClick={() => {
              setConfig("punctuation", !getConfig.punctuation);
              restartTestEvent.dispatch();
            }}
          />
          <Button
            class={buttonClass}
            variant="text"
            fa={{
              icon: "fa-hashtag",
              fixedWidth: true,
            }}
            text="numbers"
            active={getConfig.numbers}
            disabled={getConfig.mode === "zen" || getConfig.mode === "quote"}
            onClick={() => {
              setConfig("numbers", !getConfig.numbers);
              restartTestEvent.dispatch();
            }}
          />
        </div>
      </AnimeShow>
    </Anime>
  );
}

function Mode(): JSXElement {
  return (
    <div class={cn("z-2", cardClass)}>
      <Button
        class={buttonClass}
        variant="text"
        fa={{
          icon: "fa-clock",
          fixedWidth: true,
        }}
        text="time"
        active={getConfig.mode === "time"}
        onClick={() => {
          setConfig("mode", "time");
          restartTestEvent.dispatch();
        }}
      />
      <Button
        class={buttonClass}
        variant="text"
        fa={{
          icon: "fa-font",
          fixedWidth: true,
        }}
        text="words"
        active={getConfig.mode === "words"}
        onClick={() => {
          setConfig("mode", "words");
          restartTestEvent.dispatch();
        }}
      />
      <Button
        class={buttonClass}
        variant="text"
        fa={{
          icon: "fa-quote-left",
          fixedWidth: true,
        }}
        text="quote"
        active={getConfig.mode === "quote"}
        onClick={() => {
          setConfig("mode", "quote");
          restartTestEvent.dispatch();
        }}
      />
      <Button
        class={buttonClass}
        variant="text"
        fa={{
          icon: "fa-mountain",
          fixedWidth: true,
        }}
        text="zen"
        active={getConfig.mode === "zen"}
        onClick={() => {
          setConfig("mode", "zen");
          restartTestEvent.dispatch();
        }}
      />
      <Button
        class={buttonClass}
        variant="text"
        fa={{
          icon: "fa-wrench",
          fixedWidth: true,
        }}
        text="custom"
        active={getConfig.mode === "custom"}
        onClick={() => {
          setConfig("mode", "custom");
          restartTestEvent.dispatch();
        }}
      />
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

  onMount(() => {
    const el = {
      time: timeElement(),
      words: wordsElement(),
      quote: quoteElement(),
      custom: customElement(),
    };
    if (!el.time || !el.words || !el.quote || !el.custom) {
      return;
    }

    for (const e of Object.values(el)) {
      e?.hide();
    }

    el[getConfig.mode as keyof typeof el]?.show();
  });

  createEffectOn(
    () => getConfig.mode,
    (mode, previousMode) => {
      const wrapperEl = wrapperElement();
      if (!wrapperEl) {
        return;
      }
      const el = {
        time: timeElement(),
        words: wordsElement(),
        quote: quoteElement(),
        custom: customElement(),
      };
      if (!el.time || !el.words || !el.quote || !el.custom) {
        return;
      }

      el[previousMode as keyof typeof el]?.show();
      const previousWidth =
        el[previousMode as keyof typeof el]?.getOuterWidth() ?? 0;
      el[previousMode as keyof typeof el]?.hide();

      el[mode as keyof typeof el]?.show();
      const newWidth = el[mode as keyof typeof el]?.getOuterWidth() ?? 0;
      el[mode as keyof typeof el]?.hide();

      void wrapperEl.promiseAnimate({
        width: [previousWidth + "px", newWidth + "px"],
        duration: durationMs,
      });

      el[previousMode as keyof typeof el]?.show()?.animate({
        opacity: [1, 0],
        duration: durationMs,
      });

      el[mode as keyof typeof el]?.show()?.animate({
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
          marginLeft:
            getConfig.mode === "zen" ? "calc(-1*var(--card-gap))" : "0",
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
          "absolute right-0 self-center px-(--horizontal-padding) transition-[margin-right,background-color] duration-125 group-hover:mr-[calc((1.25em+(var(--horizontal-padding)*2))*-1)]",
        )}
        fa={{ icon: "fa-share", fixedWidth: true }}
        onClick={() => showModal("ShareTestSettings")}
      />
    </div>
  );
}

function Mode2Time(props: ComponentProps<"div">): JSXElement {
  return (
    <div {...props}>
      <Button
        class={buttonClass}
        variant="text"
        text="15"
        active={getConfig.time === 15}
        onClick={() => {
          setConfig("time", 15);
          restartTestEvent.dispatch();
        }}
      />
      <Button
        class={buttonClass}
        variant="text"
        text="30"
        active={getConfig.time === 30}
        onClick={() => {
          setConfig("time", 30);
          restartTestEvent.dispatch();
        }}
      />
      <Button
        class={buttonClass}
        variant="text"
        text="60"
        active={getConfig.time === 60}
        onClick={() => {
          setConfig("time", 60);
          restartTestEvent.dispatch();
        }}
      />
      <Button
        class={buttonClass}
        variant="text"
        text="120"
        active={getConfig.time === 120}
        onClick={() => {
          setConfig("time", 120);
          restartTestEvent.dispatch();
        }}
      />
      <Button
        class={buttonClass}
        variant="text"
        active={![15, 30, 60, 120].includes(getConfig.time)}
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
  return (
    <div {...props}>
      <Button
        class={buttonClass}
        variant="text"
        text="10"
        active={getConfig.words === 10}
        onClick={() => {
          setConfig("words", 10);
          restartTestEvent.dispatch();
        }}
      />
      <Button
        class={buttonClass}
        variant="text"
        text="25"
        active={getConfig.words === 25}
        onClick={() => {
          setConfig("words", 25);
          restartTestEvent.dispatch();
        }}
      />
      <Button
        class={buttonClass}
        variant="text"
        text="50"
        active={getConfig.words === 50}
        onClick={() => {
          setConfig("words", 50);
          restartTestEvent.dispatch();
        }}
      />
      <Button
        class={buttonClass}
        variant="text"
        text="100"
        active={getConfig.words === 100}
        onClick={() => {
          setConfig("words", 100);
          restartTestEvent.dispatch();
        }}
      />
      <Button
        class={buttonClass}
        variant="text"
        active={![10, 25, 50, 100].includes(getConfig.words)}
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
      <Button
        class={buttonClass}
        variant="text"
        text="short"
        active={areUnsortedArraysEqual(getConfig.quoteLength, [0])}
        onClick={() => {
          setConfig("quoteLength", [0]);
          restartTestEvent.dispatch();
        }}
      />
      <Button
        class={buttonClass}
        variant="text"
        text="medium"
        active={areUnsortedArraysEqual(getConfig.quoteLength, [1])}
        onClick={() => {
          setConfig("quoteLength", [1]);
          restartTestEvent.dispatch();
        }}
      />
      <Button
        class={buttonClass}
        variant="text"
        text="long"
        active={areUnsortedArraysEqual(getConfig.quoteLength, [2])}
        onClick={() => {
          setConfig("quoteLength", [2]);
          restartTestEvent.dispatch();
        }}
      />
      <Button
        class={buttonClass}
        variant="text"
        text="thicc"
        active={areUnsortedArraysEqual(getConfig.quoteLength, [3])}
        onClick={() => {
          setConfig("quoteLength", [3]);
          restartTestEvent.dispatch();
        }}
      />
      <Button
        class={buttonClass}
        variant="text"
        fa={{
          icon: "fa-search",
          fixedWidth: true,
        }}
        onClick={() => {
          showErrorNotification("//todo");
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
