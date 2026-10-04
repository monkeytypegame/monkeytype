import {
  createEffect,
  createMemo,
  createSignal,
  For,
  JSXElement,
  on,
  Show,
  untrack,
} from "solid-js";
import { Dynamic } from "solid-js/web";

import { setConfig } from "../../../../config/setters";
import { getConfig } from "../../../../config/store";
import { getFormatting, getIsScreenshotting } from "../../../../states/core";
import { isResultWordsJoiningScript } from "../../../../states/result";
import {
  getLastEventLog,
  getResultVisible,
  isErrorBorderDisabled,
  isLanguageRightToLeft,
} from "../../../../states/test";
import { getTheme } from "../../../../states/theme";
import { getWordBurstHistory } from "../../../../test/events/stats";
import { cn } from "../../../../utils/cn";
import { blendTwoHexColors } from "../../../../utils/colors";
import { get as getTypingSpeedUnit } from "../../../../utils/typing-speed-units";
import { AnimeShow } from "../../../common/anime";
import { buildBalloonHtmlProperties } from "../../../common/Balloon";
import { Fa } from "../../../common/Fa";
import * as ResultWordHighlight from "./result-word-highlight";
import {
  buildWordsHistory,
  copyMissedWordsList,
  copySlowWordsList,
  copyWordsList,
  HistoryWord,
  isWordsHistoryAnimated,
  isWordsHistoryOpen,
} from "./words-history";

type Heatmap = {
  steps: { val: number; colorId: number }[];
  colors: string[];
  unreachedColor: string;
  legend: string[];
};

function buildHeatmap(): Heatmap | null {
  if (!getConfig.burstHeatmap) return null;
  const eventLog = getLastEventLog();
  if (eventLog === null) return null;

  const typingSpeedUnit = getTypingSpeedUnit(getConfig.typingSpeedUnit);
  const burstlist = getWordBurstHistory(eventLog)
    .map((x) => (x >= 1000 ? Infinity : x))
    .map((burst) => Math.round(typingSpeedUnit.fromWpm(burst)))
    .sort((a, b) => a - b);

  const theme = getTheme();
  let colors = [
    theme.colorfulError,
    blendTwoHexColors(theme.colorfulError, theme.text, 0.5),
    theme.text,
    blendTwoHexColors(theme.main, theme.text, 0.5),
    theme.main,
  ];
  let unreachedColor = theme.sub;

  if (theme.main === theme.text) {
    colors = [
      theme.colorfulError,
      blendTwoHexColors(theme.colorfulError, theme.text, 0.5),
      theme.sub,
      blendTwoHexColors(theme.sub, theme.text, 0.5),
      theme.main,
    ];
    unreachedColor = theme.subAlt;
  }

  const len = burstlist.length;
  const steps = [
    { val: 0, colorId: 0 },
    { val: burstlist[(len * 0.15) | 0] as number, colorId: 1 },
    { val: burstlist[(len * 0.35) | 0] as number, colorId: 2 },
    { val: burstlist[(len * 0.65) | 0] as number, colorId: 3 },
    { val: burstlist[(len * 0.85) | 0] as number, colorId: 4 },
  ];

  const legend = steps.map((step, index) => {
    const nextStep = steps[index + 1];
    if (index === 0 && nextStep) return `<${Math.round(nextStep.val)}`;
    if (index === 4) return `${Math.round(step.val)}+`;
    if (nextStep) {
      if (step.val !== nextStep.val) {
        return `${Math.round(step.val)}-${Math.round(nextStep.val) - 1}`;
      }
      return `${Math.round(step.val)}-${Math.round(step.val)}`;
    }
    return "";
  });

  return { steps, colors, unreachedColor, legend };
}

export function ResultWordsHistory(): JSXElement {
  const heatmap = createMemo(buildHeatmap);

  // built on open, kept while closing so the slide out isn't empty
  const words = createMemo<HistoryWord[]>((prev) => {
    if (!isWordsHistoryOpen()) return prev;
    const eventLog = getLastEventLog();
    if (eventLog === null) return prev;
    return untrack(() => buildWordsHistory(eventLog));
  }, []);

  const toggleHeatmap = (): void => {
    setConfig("burstHeatmap", !getConfig.burstHeatmap);
    ResultWordHighlight.destroy();
  };

  // element is remounted on every open, so drop highlights tied to the old one
  createEffect(
    on(isWordsHistoryOpen, () => ResultWordHighlight.destroy(), {
      defer: true,
    }),
  );

  return (
    <AnimeShow
      when={isWordsHistoryOpen()}
      slide
      duration={isWordsHistoryAnimated() ? 250 : 0}
    >
      <div
        id="resultWordsHistory"
        class={isErrorBorderDisabled() ? "noErrorBorder" : undefined}
      >
        <div class="title">
          <span>input history</span>
          <TitleButton
            id="copyWordsListButton"
            text="Copy words list"
            icon="fa-align-left"
            onClick={() => void copyWordsList()}
          />
          <TitleButton
            text="Copy missed words list"
            icon="fa-times"
            onClick={() => void copyMissedWordsList()}
          />
          <TitleButton
            text="Copy slow words list"
            icon="fa-tachometer-alt"
            onClick={copySlowWordsList}
          />
          <TitleButton
            text="Toggle burst heatmap"
            icon="fa-fire-alt"
            onClick={toggleHeatmap}
          />
          <Show when={heatmap()}>
            {(map) => (
              <div class="heatmapLegend">
                <div class="boxes">
                  <For each={map().legend}>
                    {(text, i) => (
                      <div
                        class="box"
                        style={{ background: map().colors[i()] }}
                      >
                        <div>{text}</div>
                      </div>
                    )}
                  </For>
                </div>
              </div>
            )}
          </Show>
        </div>
        <div
          class={cn("words", {
            rightToLeftTest: isLanguageRightToLeft(),
            joiningScript: isResultWordsJoiningScript(),
          })}
        >
          <For each={words()}>
            {(word) => <Word word={word} heatmap={heatmap()} />}
          </For>
        </div>
      </div>
    </AnimeShow>
  );
}

function TitleButton(props: {
  id?: string;
  text: string;
  icon: "fa-align-left" | "fa-times" | "fa-tachometer-alt" | "fa-fire-alt";
  onClick: () => void;
}): JSXElement {
  return (
    <button
      type="button"
      id={props.id}
      class="textButton inline-block"
      tabIndex="-1"
      {...buildBalloonHtmlProperties({ text: props.text })}
      onClick={() => props.onClick()}
    >
      <Fa icon={props.icon} fixedWidth />
    </button>
  );
}

function getWordColor(
  burst: number | undefined,
  heatmap: Heatmap,
): string | undefined {
  if (burst === undefined) return heatmap.unreachedColor;
  // bursts used to round trip through an attribute, which dropped Infinity
  if (!Number.isFinite(burst)) return undefined;
  const value = Math.round(
    getTypingSpeedUnit(getConfig.typingSpeedUnit).fromWpm(Math.trunc(burst)),
  );
  let color: string | undefined;
  for (const step of heatmap.steps) {
    if (value >= step.val) color = heatmap.colors[step.colorId];
  }
  return color;
}

function Word(props: {
  word: HistoryWord;
  heatmap: Heatmap | null;
}): JSXElement {
  const [isHovered, setHovered] = createSignal(false);

  const color = (): string | undefined =>
    props.heatmap === null
      ? undefined
      : getWordColor(props.word.burst, props.heatmap);

  const speed = (): string => {
    const burst = props.word.burst;
    if (burst === undefined || isNaN(burst) || burst >= 1000) {
      return "Infinite";
    }
    return getFormatting().typingSpeed(Math.trunc(burst), {
      showDecimalPlaces: false,
    });
  };

  return (
    <div
      class={cn("word", {
        nocursor: props.word.input !== "",
        error: props.word.error,
        heatmapInherit: color() !== undefined && props.word.burst !== undefined,
      })}
      style={{ color: color() }}
      // read by result-word-highlight
      data-input={props.word.input}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <For each={props.word.letters}>
        {(letter) => (
          <Dynamic component="letter" class={letter.class}>
            {letter.char}
          </Dynamic>
        )}
      </For>
      <Show
        when={
          isHovered() &&
          getResultVisible() &&
          props.word.input !== "" &&
          !getIsScreenshotting()
        }
      >
        <div class="wordInputHighlight withSpeed">
          <div class="text">{props.word.input.replace(/[\t\n]/g, "_")}</div>
          <div class="speed">
            {speed()} {getConfig.typingSpeedUnit}
          </div>
        </div>
      </Show>
    </div>
  );
}
