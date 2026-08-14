import { JSXElement, onMount } from "solid-js";

import { Anime } from "./anime";
import { createTippy } from "./useTippy";

type Props = {
  percent: number;
  fill: "main" | "text";
  bg: "bg" | "sub-alt";
  showPercentageOnHover?: boolean;
  animationDuration?: number;
  animationEase?: string;
};

const bgClassMap: Record<Props["bg"], string> = {
  bg: "bg-bg",
  "sub-alt": "bg-sub-alt",
};

const fillClassMap: Record<Props["fill"], string> = {
  main: "bg-main",
  text: "bg-text",
};

export function Bar(props: Props): JSXElement {
  let el: HTMLDivElement | null = null;

  onMount(() => {
    if (el && (props.showPercentageOnHover ?? false)) {
      createTippy(el, { text: `${props.percent.toFixed(2)}%`, position: "up" });
    }
  });

  return (
    <div
      ref={(node) => (el = node)}
      class={`h-[0.5em] flex-1 rounded ${bgClassMap[props.bg]}`}
    >
      <Anime
        animation={{
          width: `${props.percent}%`,
          duration: props.animationDuration ?? 0,
          ease: props.animationEase ?? "out(2)",
        }}
      >
        <div class={`h-[0.5em] rounded ${fillClassMap[props.fill]}`}></div>
      </Anime>
    </div>
  );
}
