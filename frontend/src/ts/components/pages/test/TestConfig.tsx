import { createSignal, JSXElement } from "solid-js";

import { setConfig, setQuoteLengthAll } from "../../../config/setters";
import { getConfig } from "../../../config/store";
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
  const [shareVisible, setShareVisible] = createSignal(false);

  return (
    <div
      class={cn(
        variables,
        "relative mb-8 hidden w-max grid-cols-[1fr_auto_1fr] justify-center gap-(--card-gap) place-self-center [font-size:var(--font-size)] sm:grid",
      )}
      onMouseEnter={() => setShareVisible(true)}
      onMouseLeave={() => setShareVisible(false)}
    >
      <PuncAndNum />
      <Mode />
      <Mode2 />
      <AnimeShow
        when={shareVisible()}
        // when={true}
        class="absolute right-0 self-center"
        animeProps={{
          initial: { opacity: 0, marginRight: "2rem" },
          animate: { opacity: 1, marginRight: 0, duration: durationMs },
          exit: { opacity: 0, marginRight: "2rem", duration: durationMs },
        }}
      >
        <Button
          variant="text"
          class={buttonClass}
          fa={{ icon: "fa-share", fixedWidth: true }}
          onClick={() => showModal("ShareTestSettings")}
        />
      </AnimeShow>
    </div>
  );
}

function PuncAndNum(): JSXElement {
  return (
    <div class="w-max place-self-end">
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
    </div>
  );
}

function Mode(): JSXElement {
  return (
    <div class={cardClass}>
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
  const sClass = "z-2 col-start-1 row-start-1 grid w-max place-self-start";

  return (
    <Anime
      // class="grid rounded bg-sub-alt w-max place-self-start px-3"
      class="grid"
      animation={{
        opacity: getConfig.mode === "zen" ? 0 : 1,
        duration: durationMs,
      }}
    >
      <AnimeShow
        when={getConfig.mode === "time"}
        duration={durationMs}
        class={cn(cardClass, sClass)}
      >
        <Mode2Time />
      </AnimeShow>
      <AnimeShow
        when={getConfig.mode === "words"}
        duration={durationMs}
        class={cn(cardClass, sClass)}
      >
        <Mode2Words />
      </AnimeShow>
      <AnimeShow
        when={getConfig.mode === "quote"}
        duration={durationMs}
        class={cn(cardClass, sClass)}
      >
        <Mode2Quote />
      </AnimeShow>
      <AnimeShow
        when={getConfig.mode === "custom"}
        duration={durationMs}
        class={cn(cardClass, sClass)}
      >
        <Mode2Custom />
      </AnimeShow>
    </Anime>
  );
}

function Mode2Time(): JSXElement {
  return (
    <div>
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

function Mode2Words(): JSXElement {
  return (
    <div>
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

function Mode2Quote(): JSXElement {
  return (
    <div>
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

function Mode2Custom(): JSXElement {
  return (
    <div>
      <Button
        class={buttonClass}
        variant="text"
        text="change"
        onClick={() => {
          showErrorNotification("//todo");
        }}
      />
    </div>
  );
}
