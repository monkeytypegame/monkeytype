import {
  onCleanup,
  onMount,
  splitProps,
  type JSX,
  type ParentProps,
} from "solid-js";
import tippy, { type Props as TippyProps, type Instance } from "tippy.js";

import type { BalloonProps } from "./useTippy";

import { cn } from "../../utils/cn";

type Props = ParentProps<BalloonProps> &
  Omit<JSX.HTMLAttributes<HTMLElement>, "aria-label"> & {
    inline?: boolean;
  };

export function Balloon(props: Props) {
  const [local, rest] = splitProps(props, [
    "text",
    "position",
    "length",
    "children",
    "class",
    "ref",
  ]);

  let el: HTMLDivElement | null = null;
  let instance: Instance | null = null;

  onMount(() => {
    if (!el || local.text === undefined || local.text === "") return;
    const tippyProps: Partial<TippyProps> = {
      content: local.text,
      placement: mapPosition(local.position ?? "up"),
      arrow: false,
      trigger: "mouseenter focus",
    };

    const maxLen = mapLength(local.length);
    if (maxLen !== undefined) {
      tippyProps.maxWidth = maxLen;
    }

    instance = tippy(el, { ...tippyProps });
  });

  onCleanup(() => instance?.destroy());

  return (
    <div
      ref={(node: HTMLDivElement) => {
        el = node;
      }}
      class={cn(
        "rounded-[0.5em] px-[0.5em] py-[0.25em] text-em-xs whitespace-nowrap",
        local.class,
      )}
      {...rest}
    >
      {local.children}
    </div>
  );
}

function mapPosition(pos: BalloonProps["position"]): TippyProps["placement"] {
  return ({ up: "top", down: "bottom", left: "left", right: "right" } as const)[
    pos ?? "up"
  ];
}

function mapLength(
  length: BalloonProps["length"],
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

export type { BalloonProps };
