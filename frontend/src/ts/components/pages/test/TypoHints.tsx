import {
  createEffect,
  createMemo,
  createSignal,
  Index,
  JSXElement,
  on,
} from "solid-js";

import { getConfig } from "../../../config/store";
import {
  RenderedWord,
  trackTypoHintsLayout,
  wordsRenderState,
} from "../../../states/words-render";
import {
  createTypoHints,
  MergedTypoHint,
  mergeTypoHints,
  TypoHint,
  TypoHintBox,
} from "./typo-hints";

declare module "solid-js" {
  // oxlint-disable-next-line typescript/no-namespace
  namespace JSX {
    // interface needed for declaration merging
    // oxlint-disable-next-line typescript/consistent-type-definitions
    interface IntrinsicElements {
      hint: JSX.HTMLAttributes<HTMLElement>;
    }
  }
}

/** what the current hint positions were measured for */
type MeasureKey = {
  hints: TypoHint[];
  input: string;
  composition: string;
};

function sameHints(a: TypoHint[], b: TypoHint[]): boolean {
  return (
    a.length === b.length &&
    a.every(
      (hint, i) =>
        hint.letterIndex === b[i]?.letterIndex && hint.char === b[i]?.char,
    )
  );
}

/** single-letter hints, rendered to be measured before merging */
function toSingleLetterHints(hints: TypoHint[]): MergedTypoHint[] {
  return hints.map((hint) => ({
    letterIndices: [hint.letterIndex],
    chars: hint.char,
    left: 0,
  }));
}

/**
 * Typo hints of a word, rendered inside its hints container. Rendered in two
 * passes within the same frame: single-letter hints first, measured against
 * the word's letters, then merged where they would overlap.
 */
export function TypoHints(props: { word: RenderedWord }): JSXElement {
  const hints = createMemo(
    () =>
      wordsRenderState.rendersLettersFromInput
        ? []
        : createTypoHints(
            props.word.text,
            props.word.input,
            getConfig.indicateTypos,
          ),
    [],
    { equals: sameHints },
  );
  // anything that can move the word's letters re-measures
  const measureKey = createMemo<MeasureKey>(() => {
    trackTypoHintsLayout();
    return {
      hints: hints(),
      input: props.word.input,
      composition: props.word.composition,
    };
  });
  const [measured, setMeasured] = createSignal<{
    key: MeasureKey;
    hints: MergedTypoHint[];
  }>();
  // single-letter hints until the current key is measured
  const displayedHints = createMemo(() => {
    const current = measured();
    if (current?.key === measureKey()) return current.hints;
    return toSingleLetterHints(hints());
  });

  let containerRef: HTMLDivElement | undefined;

  // effect, not onMount (exception to the refs standard): re-measures on
  // every key change. Runs after the single-letter hints of the new key are in
  // the DOM
  createEffect(
    on(measureKey, (key) => {
      const container = containerRef;
      const singleHints = key.hints;
      if (container === undefined || singleHints.length === 0) return;
      const letters =
        container.parentElement?.querySelectorAll<HTMLElement>(
          ":scope > letter",
        );
      const hintElements = container.children;
      const boxes = singleHints.map((hint, i): TypoHintBox => {
        const letter = letters?.[hint.letterIndex];
        const hintElement = hintElements[i] as HTMLElement | undefined;
        return {
          letterLeft: letter?.offsetLeft ?? 0,
          letterWidth: letter?.offsetWidth ?? 0,
          letterTop: letter?.offsetTop ?? 0,
          hintWidth: hintElement?.offsetWidth ?? 0,
        };
      });
      setMeasured({ key, hints: mergeTypoHints(singleHints, boxes) });
    }),
  );

  return (
    <div
      ref={(el) => (containerRef = el)}
      class="hints [.joiningScript_&]:wrap-normal"
    >
      <Index each={displayedHints()}>
        {(hint) => (
          <hint
            class="absolute bottom-[-1.1em] grid -translate-x-1/2 animate-(--correct-letter-animation) justify-center p-px text-center text-[0.75em] leading-[initial] text-(--correct-letter-color) opacity-50 text-shadow-none [.blind_&]:hidden"
            style={{ left: `${hint().left}px` }}
          >
            {hint().chars}
          </hint>
        )}
      </Index>
    </div>
  );
}
