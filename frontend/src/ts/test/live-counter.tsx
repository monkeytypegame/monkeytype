import { Accessor, JSXElement } from "solid-js";
import { useVisibilityAnimation } from "../hooks/useVisibilityAnimation";
import { useRefWithUtils } from "../hooks/useRefWithUtils";

export function LiveCounter(props: {
  value: Accessor<string>;
  visible: Accessor<{
    value: boolean;
    withAnimation: boolean;
  }>;
  class?: string;
}): JSXElement {
  const [ref, element] = useRefWithUtils<HTMLDivElement>();

  useVisibilityAnimation({
    element,
    visible: () => props.visible().value,
    animate: () => props.visible().withAnimation,
  });

  return (
    <div ref={ref} class={props.class}>
      {props.value()}
    </div>
  );
}
