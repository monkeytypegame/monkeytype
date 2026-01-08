import { Accessor, JSXElement } from "solid-js";
import { ElementWithUtils } from "../utils/dom";
import { isFocused } from "./focus";
import { useVisibilityAnimation } from "../hooks/useVisibilityAnimation";

export function LiveCounter(props: {
  value: Accessor<string>;
  visible: Accessor<{
    value: boolean;
    withAnimation: boolean;
  }>;
  class?: string;
}): JSXElement {
  let ref: ElementWithUtils<HTMLDivElement> | undefined;

  useVisibilityAnimation({
    element: () => ref,
    visible: () => props.visible().value && isFocused(),
    animate: () => props.visible().withAnimation,
  });

  return (
    <div ref={(el) => (ref = new ElementWithUtils(el))} class={props.class}>
      {props.value()}
    </div>
  );
}
