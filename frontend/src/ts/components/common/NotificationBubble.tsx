import { JSXElement, Show } from "solid-js";

import { cn } from "../../utils/cn";

type Props = {
  variant: "fromCorner" | "atCorner" | "center";
  show: boolean;
  class?: string;
};

export function NotificationBubble(props: Props): JSXElement {
  return (
    <Show when={props.show}>
      <div
        class={cn(
          "absolute h-[0.5em] w-[0.5em] rounded-full bg-main ring-[0.25em] ring-bg",
          props.variant === "fromCorner" && "top-0 right-0 m-[0.375em]",
          props.variant === "atCorner" &&
            "top-0 right-0 translate-x-1/2 -translate-y-1/2",
          props.variant === "center" &&
            "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
          props.class,
        )}
        data-ui-element="notificationBubble"
      ></div>
    </Show>
  );
}
