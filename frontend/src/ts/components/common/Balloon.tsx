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
  options: BalloonProps | undefined,
): Record<string, string> {
  if (
    options === undefined ||
    options.text === undefined ||
    options.text === ""
  ) {
    return {};
  }
  return {
    "aria-label": options.text,
    "data-balloon-pos": options.position ?? "up",
    ...(options.break ? { "data-balloon-break": "" } : {}),
    ...(options.length ? { "data-balloon-length": options.length } : {}),
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
