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

const ICONS: Map<string, FaProps> = new Map([
  [
    "\t",
    {
      variant: "solid",
      icon: "fa-long-arrow-alt-right",
      fixedWidth: true,
    },
  ],
  [
    "\n",
    {
      variant: "solid",
      icon: "fa-level-down-alt",
      fixedWidth: true,
      class: "fa-rotate-90",
    },
  ],
  ["←", { variant: "solid", icon: "fa-arrow-left" }],
  ["↓", { variant: "solid", icon: "fa-arrow-down" }],
  ["↑", { variant: "solid", icon: "fa-arrow-up" }],
  ["→", { variant: "solid", icon: "fa-arrow-right" }],
]);

// chars rendered as icons instead of text
function getCharIconProps(char: string): FaProps | undefined {
  return ICONS.get(char);
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
  status: LetterStatus;
  /** expected char is a tab/newline: keeps its marker class on typos too */
  controlType?: "tab" | "newline";
  /** zen: empty-word placeholder, typed tab/newline */
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
      <Show
        when={getCharIconProps(props.letter.text)}
        fallback={props.letter.text}
      >
        {(icon) => <Fa {...icon()} />}
      </Show>
    </letter>
  );
}
