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

export type Letter = {
  text: string;
  icon?: FaProps;
  correct?: boolean;
  incorrect?: boolean;
  extra?: boolean;
  dead?: boolean;
  tabChar?: boolean;
  nlChar?: boolean;
  invisible?: boolean;
  /** zen: typed tab/newline take up space but stay invisible */
  hidden?: boolean;
};

// hot path: plain join, the class names are fixed (no tailwind-merge needed)
function letterClass(letter: Letter): string {
  let cls = "";
  if (letter.correct) cls += " correct";
  if (letter.incorrect) cls += " incorrect";
  if (letter.extra) cls += " extra";
  if (letter.dead) cls += " dead";
  if (letter.tabChar) cls += " tabChar";
  if (letter.nlChar) cls += " nlChar";
  if (letter.invisible) cls += " invisible";
  if (letter.hidden) cls += " opacity-0";
  return cls.slice(1);
}

export function WordLetter(props: { letter: Letter }): JSXElement {
  return (
    <letter class={letterClass(props.letter)}>
      <Show when={props.letter.icon} fallback={props.letter.text}>
        {(icon) => <Fa {...icon()} />}
      </Show>
    </letter>
  );
}
