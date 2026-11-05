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

export type RenderedLetter = {
  /** shown char, icon chars render as icons */
  text: string;
  status: LetterStatus;
  /** zen: empty-word placeholder, typed tab/newline */
  invisible?: boolean;
};

const STATUS_CLASS: Record<LetterStatus, string> = {
  untyped: "",
  correct: " correct",
  incorrect: " incorrect",
  extra: " incorrect extra",
  dead: " dead",
  deadCorrect: " dead correct",
};

// hot path: plain join, the class names are fixed (no tailwind-merge needed)
function letterClass(letter: RenderedLetter): string {
  let cls = STATUS_CLASS[letter.status];
  if (letter.text === "\t") cls += " tabChar";
  if (letter.text === "\n") cls += " nlChar";
  if (letter.invisible) cls += " invisible";
  return cls.slice(1);
}

export function WordLetter(props: { letter: RenderedLetter }): JSXElement {
  return (
    <letter class={letterClass(props.letter)}>
      <Show
        when={getCharIconProps(props.letter.text)}
        fallback={props.letter.text}
      >
        {(icon) => <Fa {...icon()} />}
      </Show>
    </letter>
  );
}
