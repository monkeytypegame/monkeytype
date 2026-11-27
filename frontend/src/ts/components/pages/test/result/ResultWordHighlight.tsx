import {
  createEffect,
  createSignal,
  For,
  JSXElement,
  on,
  onCleanup,
  Show,
  untrack,
} from "solid-js";

import type { HistoryWord } from "../../../../test/words-history";

import { createTrigger } from "../../../../hooks/createTrigger";
import { getIsScreenshotting } from "../../../../states/core";
import {
  getHighlightedWordRange,
  HighlightedWordRange,
} from "../../../../states/result";
import { isLanguageRightToLeft } from "../../../../states/test";
import { cn } from "../../../../utils/cn";

// padding around the highlighted words
const PADDING_X = 16;
const PADDING_Y = 12;

type LineWord = {
  index: number;
  // from the line's start edge (left, or right in RTL)
  offset: number;
  top: number;
  // typed text, cut to the word's letter count
  input: string;
};

// one row of words history words, positions relative to #resultWordsHistory
type Line = {
  top: number;
  left: number;
  width: number;
  height: number;
  // where the line starts on a strip of all lines laid end to end (with
  // padding between), so a highlight slides across line breaks
  stripStart: number;
  words: LineWord[];
};

// the highlight's start and end edge within each line's container
type Position = { start: number; end: number };

function measureLines(wordEls: HTMLElement[], words: HistoryWord[]): Line[] {
  const rtl = isLanguageRightToLeft();
  const rows: { el: HTMLElement; index: number }[][] = [];
  let rowTop: number | undefined;
  for (const [index, el] of wordEls.entries()) {
    if (el.offsetTop !== rowTop) {
      rows.push([]);
      rowTop = el.offsetTop;
    }
    rows[rows.length - 1]?.push({ el, index });
  }

  const lines: Line[] = [];
  let stripStart = 0;
  for (const row of rows) {
    const left = Math.min(...row.map((w) => w.el.offsetLeft));
    const right = Math.max(
      ...row.map((w) => w.el.offsetLeft + w.el.offsetWidth),
    );
    const top = Math.min(...row.map((w) => w.el.offsetTop));
    const bottom = Math.max(
      ...row.map((w) => w.el.offsetTop + w.el.offsetHeight),
    );
    const width = right - left;
    lines.push({
      top,
      left,
      width,
      height: bottom - top,
      stripStart,
      words: row.map(({ el, index }) => ({
        index,
        offset: rtl
          ? right - (el.offsetLeft + el.offsetWidth)
          : el.offsetLeft - left,
        top: el.offsetTop - top,
        input: (words[index]?.input ?? "")
          .replace(/[\t\n]/g, "_")
          .slice(0, el.childElementCount),
      })),
    });
    stripStart += width + PADDING_X;
  }
  return lines;
}

function findWord(
  lines: Line[],
  index: number,
): { line: Line; word: LineWord } | undefined {
  for (const line of lines) {
    const word = line.words.find((w) => w.index === index);
    if (word !== undefined) return { line, word };
  }
  return undefined;
}

/**
 * Highlights the words history words in the chart's hovered range, showing
 * what was typed over them. Measures the words on the first highlight after
 * mount, a resize or new words.
 */
export function ResultWordHighlight(props: {
  words: HistoryWord[];
  getWordEls: () => HTMLElement[];
}): JSXElement {
  const [lines, setLines] = createSignal<Line[]>();
  const [positions, setPositions] = createSignal<Position[]>();
  const [isAnimated, setAnimated] = createSignal(false);
  const [trackResize, notifyResize] = createTrigger();
  const inputEls: HTMLElement[] = [];

  // highlights are absolutely positioned, stale after a resize or new words
  window.addEventListener("resize", notifyResize);
  onCleanup(() => window.removeEventListener("resize", notifyResize));
  createEffect(
    on(
      [() => props.words, trackResize],
      () => {
        setLines(undefined);
        setPositions(undefined);
      },
      { defer: true },
    ),
  );

  const isVisible = (): boolean =>
    getHighlightedWordRange() !== undefined && positions() !== undefined;

  createEffect<HighlightedWordRange | undefined>((prevRange) => {
    const range = getHighlightedWordRange();
    if (range === undefined) return undefined;
    const current = lines();
    if (current === undefined) {
      // reruns once the line containers (and their input words) rendered
      setLines(
        measureLines(
          untrack(props.getWordEls).slice(0, props.words.length),
          props.words,
        ),
      );
      return undefined;
    }
    const first = findWord(current, range.first);
    const last = findWord(
      current,
      Math.min(range.last, props.words.length - 1),
    );
    if (first === undefined || last === undefined) return undefined;

    const lastWidth = inputEls[last.word.index]?.offsetWidth ?? 0;
    const start = first.line.stripStart + first.word.offset;
    const end = last.line.stripStart + last.word.offset + lastWidth + PADDING_X;
    // the first highlight after a hidden one appears in place
    setAnimated(prevRange !== undefined);
    setPositions(
      current.map((line) => ({
        start: start - line.stripStart,
        end: end - line.stripStart,
      })),
    );
    return range;
  });

  const startSide = (): "left" | "right" =>
    isLanguageRightToLeft() ? "right" : "left";
  const endSide = (): "left" | "right" =>
    isLanguageRightToLeft() ? "left" : "right";

  return (
    <Show when={lines()}>
      {(current) => (
        <For each={current()}>
          {(line, i) => {
            const containerWidth = line.width + PADDING_X;
            const position = (): Position =>
              positions()?.[i()] ?? { start: 0, end: 0 };
            return (
              <div
                class={cn(
                  "highlightContainer",
                  getIsScreenshotting() && "hidden",
                )}
                style={{
                  top: `${line.top - PADDING_Y / 2}px`,
                  left: `${line.left - PADDING_X / 2}px`,
                  width: `${containerWidth}px`,
                  height: `${line.height + PADDING_Y}px`,
                }}
              >
                <div
                  class={cn("highlight", {
                    withAnimation: isAnimated(),
                    "highlight-hidden": !isVisible(),
                  })}
                  style={{
                    [startSide()]: `${position().start}px`,
                    [endSide()]: `${containerWidth - position().end}px`,
                  }}
                >
                  <div
                    class={cn("inputWordsContainer", {
                      withAnimation: isAnimated(),
                    })}
                    style={{
                      [startSide()]: `${-position().start}px`,
                      width: `${containerWidth}px`,
                    }}
                  >
                    <For each={line.words.filter((w) => w.input !== "")}>
                      {(word) => (
                        <div
                          ref={(el) => (inputEls[word.index] = el)}
                          class="inputWord"
                          style={{
                            [startSide()]: `${word.offset + PADDING_X / 2}px`,
                            top: `${word.top + PADDING_Y / 2}px`,
                          }}
                        >
                          {word.input}
                        </div>
                      )}
                    </For>
                  </div>
                </div>
              </div>
            );
          }}
        </For>
      )}
    </Show>
  );
}
