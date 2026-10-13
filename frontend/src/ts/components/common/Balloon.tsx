import type { JSX, JSXElement, ParentProps } from "solid-js";

import {
  AnyRouter,
  createLink,
  LinkComponentProps,
  RegisteredRouter,
} from "@tanstack/solid-router";
import { Show, splitProps } from "solid-js";
import { Dynamic } from "solid-js/web";

import { getIsScreenshotting } from "../../states/core";

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

const BalloonLink = createLink(BalloonAnchor);

type BalloonLinkProps<
  TRouter extends AnyRouter = RegisteredRouter,
  TFrom extends string = string,
  TTo extends string | undefined = undefined,
  TMaskFrom extends string = TFrom,
  TMaskTo extends string = "",
> = LinkComponentProps<
  typeof BalloonAnchor,
  TRouter,
  TFrom,
  TTo,
  TMaskFrom,
  TMaskTo
>;

export function Balloon(props: Props & { to?: never }): JSXElement;
/**
 * In-app link with a balloon: a real anchor (href, cmd/ctrl+click opens a new
 * tab) that navigates through the router with typed `to`, `params` and `search`.
 */
export function Balloon<
  TRouter extends AnyRouter = RegisteredRouter,
  const TFrom extends string = string,
  const TTo extends string | undefined = undefined,
  const TMaskFrom extends string = TFrom,
  const TMaskTo extends string = "",
>(props: BalloonLinkProps<TRouter, TFrom, TTo, TMaskFrom, TMaskTo>): JSXElement;
export function Balloon(
  props: Props | BalloonLinkProps<AnyRouter, string, string, string, string>,
): JSXElement {
  return (
    <Show
      when={"to" in props}
      fallback={<BalloonElement {...(props as Props)} />}
    >
      <BalloonLink {...(props as BalloonLinkProps)} />
    </Show>
  );
}

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
