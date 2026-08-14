import {
  createMemo,
  onCleanup,
  onMount,
  type JSX,
  type ParentProps,
} from "solid-js";
import { Dynamic } from "solid-js/web";
import tippy, { type Props as TippyProps, type Instance } from "tippy.js";

export type TooltipProps = ParentProps<{
  /** Text to display in the tooltip. If empty/undefined, no tooltip is created. */
  text: string;
  position?: "up" | "down" | "left" | "right";
  length?: "small" | "medium" | "large" | "xlarge" | "fit";
  /** HTML element type to render (default: div). Use "span" for inline. */
  as?: keyof JSX.IntrinsicElements;
  class?: string;
}> &
  Omit<JSX.HTMLAttributes<HTMLElement>, "children">;

const POSITION_MAP: Record<
  "up" | "down" | "left" | "right",
  TippyProps["placement"]
> = {
  up: "top",
  down: "bottom",
  left: "left",
  right: "right",
};

function mapLength(
  length: TooltipProps["length"],
): TippyProps["maxWidth"] | undefined {
  if (length === undefined) return undefined;
  switch (length) {
    case "small":
      return 120;
    case "medium":
      return 180;
    case "large":
      return 300;
    case "xlarge":
      return 450;
    case "fit":
      return "fit";
    default:
      return undefined;
  }
}

/**
 * A lightweight wrapper that initializes a tippy.js tooltip on its content.
 * Replaces balloon-css `[aria-label][data-balloon-pos]` usage for inline elements.
 */
export function Tooltip(props: TooltipProps): JSX.Element {
  const tag = createMemo(() => props.as ?? "div");

  let el: HTMLElement | null = null;
  let instance: Instance | null = null;

  onMount(() => {
    if (!el || !props.text || props.text === "") return;
    const tippyProps: Partial<TippyProps> = {
      content: props.text,
      placement: POSITION_MAP[props.position ?? "up"],
      arrow: false,
      trigger: "mouseenter focus",
    };

    const maxLen = mapLength(props.length);
    if (maxLen !== undefined) {
      tippyProps.maxWidth = maxLen;
    }

    instance = tippy(el, { ...tippyProps });
  });

  onCleanup(() => instance?.destroy());

  return (
    <Dynamic
      component={tag()}
      ref={(node: HTMLElement | null) => (el = node)}
      class={props.class}
    >
      {props.children}
    </Dynamic>
  );
}
