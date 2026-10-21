import { JSXElement, Show } from "solid-js";

import { Fa, type FaProps } from "../../common/Fa";

declare module "solid-js" {
  // oxlint-disable-next-line typescript/no-namespace
  namespace JSX {
    // interface needed for declaration merging
    // oxlint-disable-next-line typescript/consistent-type-definitions
    interface IntrinsicElements {
      letter: JSX.HTMLAttributes<HTMLElement>;
    }
  }
}

export type LetterStatus =
  | "untyped"
  | "correct"
  | "incorrect"
  | "extra"
  | "dead"
  | "deadCorrect";

export type Letter = {
  text: string;
  icon?: FaProps;
  status: LetterStatus;
  /** expected char is a tab/newline: keeps its marker class on typos too */
  controlType?: "tab" | "newline";
  /** zen: empty-word placeholder, typed tab/newline icons */
  hidden?: boolean;
};

const STATUS_CLASS: Record<LetterStatus, string> = {
  untyped: "",
  correct: " correct",
  incorrect: " incorrect",
  extra: " incorrect extra",
  dead: " dead",
  deadCorrect: " dead correct",
};

const CONTROL_TYPE_CLASS = {
  tab: " tabChar",
  newline: " nlChar",
} as const;

// hot path: plain join, the class names are fixed (no tailwind-merge needed)
function letterClass(letter: Letter, allCorrect: boolean): string {
  let cls = STATUS_CLASS[letter.status];
  // blind mode: shown as correct, but incorrect/extra keep their classes
  // (blind CSS hides extras)
  if (
    allCorrect &&
    letter.status !== "correct" &&
    letter.status !== "deadCorrect"
  ) {
    cls += " correct";
  }
  if (letter.controlType !== undefined) {
    cls += CONTROL_TYPE_CLASS[letter.controlType];
  }
  if (letter.hidden) cls += " invisible";
  return cls.slice(1);
}

export function WordLetter(props: {
  letter: Letter;
  allCorrect: boolean;
}): JSXElement {
  return (
    <letter class={letterClass(props.letter, props.allCorrect)}>
      <Show when={props.letter.icon} fallback={props.letter.text}>
        {(icon) => <Fa {...icon()} />}
      </Show>
    </letter>
  );
}
