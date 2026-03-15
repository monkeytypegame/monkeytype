import type { JSX, ParentProps } from "solid-js";

import { splitProps } from "solid-js";
import { Dynamic } from "solid-js/web";

export type BalloonProps = {
  text?: string;
  position?: BalloonPosition;
  break?: boolean;
  length?: "small" | "medium" | "large" | "xlarge" | "fit";
};

type BalloonPosition = "up" | "down" | "left" | "right";

type Props = ParentProps<BalloonProps> &
  Omit<JSX.HTMLAttributes<HTMLElement>, "aria-label"> & {
    inline?: boolean;
  };

export function buildBalloonHtmlProperties(
  props: BalloonProps | undefined,
): Record<string, string> {
  // oxlint-disable-next-line solid/reactivity just a util - consumer is responsible for reactivity
  if (props === undefined || props.text === undefined || props.text === "") {
    return {};
  }
  return {
    // oxlint-disable-next-line solid/reactivity just a util - consumer is responsible for reactivity
    "aria-label": props.text,
    // oxlint-disable-next-line solid/reactivity
    "data-balloon-pos": props.position ?? "up",
    // oxlint-disable-next-line solid/reactivity
    ...(props.break ? { "data-balloon-break": "" } : {}),
    // oxlint-disable-next-line solid/reactivity
    ...(props.length ? { "data-balloon-length": props.length } : {}),
  };
}

export function Balloon(props: Props) {
  const [local, rest] = splitProps(props, [
    "text",
    "position",
    "break",
    "length",
    "inline",
    "children",
  ]);

  const attrs = () => buildBalloonHtmlProperties(local);

  return (
    <Dynamic component={local.inline ? "span" : "div"} {...attrs()} {...rest}>
      {local.children}
    </Dynamic>
  );
}
