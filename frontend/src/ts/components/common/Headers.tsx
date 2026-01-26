import { JSXElement } from "solid-js";

import { Fa, FaProps } from "./Fa";

export function H2(props: {
  text: string;
  fa: FaProps;
  children?: JSXElement;
}): JSXElement {
  return (
    <h2 class="text-sub flex place-items-center gap-4 pb-4 text-4xl">
      <Fa {...props.fa} />
      {props.text}
      {props.children}
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
