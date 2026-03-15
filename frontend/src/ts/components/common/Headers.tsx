import { JSXElement, Show } from "solid-js";

import { cn } from "../../utils/cn";
import { Fa, FaProps } from "./Fa";

export function H2(props: {
  id?: string;
  class?: string;
  text: string;
  fa?: FaProps;
}): JSXElement {
  return (
    <h2
      id={props.id}
      class={cn(
        "flex place-items-center gap-[0.5em] pb-[0.5em] text-[2.25em] text-sub",
        props.class,
      )}
    >
      <Show when={props.fa}>
        <Fa {...(props.fa as FaProps)} />
      </Show>
      {props.text}
    </h2>
  );
}

// oxlint-disable-next-line monkeytype-rules/one-component-per-file
export function H3(props: {
  id?: string;
  class?: string;
  text: string;
  fa: FaProps;
}): JSXElement {
  return (
    <h3
      id={props.id}
      class={cn(
        "flex place-items-center gap-[0.5em] pb-[0.5em] text-[1em] text-sub",
        props.class,
      )}
    >
      <Fa {...props.fa} />
      {props.text}
    </h3>
  );
}
