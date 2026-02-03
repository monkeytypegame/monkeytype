import { JSXElement, Show } from "solid-js";

import { Fa, FaProps } from "./Fa";

export function H1(props: { text: string; fa?: FaProps }): JSXElement {
  return (
    <h1 class="text-sub flex place-items-center gap-4 pb-4 text-4xl">
      <Show when={props.fa}>
        <Fa {...(props.fa as FaProps)} />
      </Show>
      {props.text}
    </h1>
  );
}

export function H2(props: { text: string; fa?: FaProps }): JSXElement {
  return (
    <h2 class="text-sub flex place-items-center gap-4 pb-4 text-2xl">
      <Show when={props.fa}>
        <Fa {...(props.fa as FaProps)} />
      </Show>
      {props.text}
    </h2>
  );
}

export function H3(props: { text: string; fa: FaProps }): JSXElement {
  return (
    <h3 class="text-sub flex place-items-center gap-2 pb-2">
      <Fa {...props.fa} />
      {props.text}
    </h3>
  );
}
