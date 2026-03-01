import { JSXElement } from "solid-js";

type Props = {
  percent: number;
  fill: "main" | "text";
  bg: "bg" | "sub-alt";
  showPercentageOnHover?: boolean;
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
      <div
        class={`h-[0.5em] rounded bg-${props.fill}`}
        style={{
          width: props.percent + "%",
        }}
      ></div>
    </div>
  );
}
