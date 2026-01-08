import { Accessor, JSXElement } from "solid-js";
import {
  useVisibilityAnimation,
  VisibilityAnimationOptions,
} from "../hooks/useVisibilityAnimation";
import { useRefWithUtils } from "../hooks/useRefWithUtils";

export function LiveCounter(props: {
  value: Accessor<string>;
  visibilityOptions?: Accessor<VisibilityAnimationOptions>;
  class?: string;
}): JSXElement {
  const [ref, element] = useRefWithUtils<HTMLDivElement>();

  useVisibilityAnimation(element, props.visibilityOptions);

  return (
    <div ref={ref} class={props.class}>
      {props.value()}
    </div>
  );
}
