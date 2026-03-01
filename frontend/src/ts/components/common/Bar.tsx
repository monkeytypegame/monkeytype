import { JSXElement } from "solid-js";

import { Anime } from "./anime";

type Props = {
  percent: number;
  fill: "main" | "text";
  bg: "bg" | "sub-alt";
  showPercentageOnHover?: boolean;
  animationDuration?: number;
  animationEase?: string;
};

export function Bar(props: Props): JSXElement {
  return (
    <div
      class={`h-[0.5em] flex-1 rounded bg-${props.bg}`}
      {...((props.showPercentageOnHover ?? false)
        ? {
            "data-balloon-pos": "up",
            "aria-label": props.percent.toFixed(2) + "%",
          }
        : {})}
    >
      <Anime
        animation={{
          width: props.percent + "%",
          duration: props.animationDuration ?? 0,
          ease: props.animationEase ?? "out(2)",
        }}
      >
        <div class={`h-[0.5em] rounded bg-${props.fill}`}></div>
      </Anime>
    </div>
  );
}
