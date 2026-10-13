import type { JSX, JSXElement, ParentProps } from "solid-js";

import { splitProps } from "solid-js";
import { Dynamic } from "solid-js/web";

import { getIsScreenshotting } from "../../states/core";
import { withLink } from "./withLink";

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
  // no balloons in screenshots
  if (
    options === undefined ||
    options.text === undefined ||
    options.text === "" ||
    getIsScreenshotting()
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

/** The anchor rendered by `BalloonLink` - receives href and handlers from the router. */
function BalloonAnchor(
  props: ParentProps<BalloonProps> &
    Omit<JSX.AnchorHTMLAttributes<HTMLAnchorElement>, "aria-label">,
): JSXElement {
  const [local, rest] = splitProps(props, [
    "text",
    "position",
    "break",
    "length",
    "children",
  ]);

  return (
    <a {...rest} {...buildBalloonHtmlProperties(local)}>
      {local.children}
    </a>
  );
}

/** An element with a balloon, or an in-app link with one (`to`, see withLink). */
export const Balloon = withLink(BalloonElement, BalloonAnchor);

function BalloonElement(props: Props): JSXElement {
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
