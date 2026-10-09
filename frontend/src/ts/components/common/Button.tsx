import { Link, RegisteredRouter, RoutePaths } from "@tanstack/solid-router";
import { JSXElement, Match, Show, Switch } from "solid-js";

import { cn } from "../../utils/cn";
import { BalloonProps, buildBalloonHtmlProperties } from "./Balloon";
import { Fa, FaProps } from "./Fa";

type BaseProps = {
  text?: string;
  fa?: FaProps;
  class?: string;
  variant?: "text" | "button";
  children?: JSXElement;
  balloon?: BalloonProps;
  onClick?: (e: MouseEvent) => void;
  type?: HTMLButtonElement["type"];
  onMouseEnter?: (e: MouseEvent) => void;
  onMouseLeave?: (e: MouseEvent) => void;
  dataset?: Record<string, string>;
  active?: boolean;
  tabIndex?: number | string;
  id?: string;
};

export type ButtonProps = BaseProps & {
  type?: "button" | "submit" | "reset";
  href?: never;
  to?: never;
  sameTarget?: true;
  disabled?: boolean;
  danger?: boolean;
};

/** External link, opens in a new tab (unless it's a `#` anchor). */
type AnchorProps = BaseProps & {
  href: string;
  to?: never;
  // onClick?: never;
  disabled?: never;
  type?: never;
};

/** In-app link, navigates through the router. */
type LinkProps = BaseProps & {
  to: RoutePaths<RegisteredRouter["routeTree"]>;
  params?: Record<string, string>;
  href?: never;
  disabled?: never;
  type?: never;
};

export function Button(
  props: ButtonProps | AnchorProps | LinkProps,
): JSXElement {
  const isAnchor = (): boolean => "href" in props || "to" in props;
  const isActive = (): boolean =>
    (!isAnchor() && !("href" in props) && props.active) ?? false;

  const variant = () => props.variant ?? "button";

  const content = (
    <>
      <Show when={props.fa !== undefined}>
        <Fa {...(props.fa as FaProps)} />
      </Show>
      <Show when={props.text !== undefined}>{props.text}</Show>
      {props.children}
    </>
  );

  const balloonHtmlProps = () => buildBalloonHtmlProperties(props.balloon);

  const getClasses = (): string => {
    return cn(
      "inline-flex h-min cursor-pointer appearance-none items-center justify-center gap-[0.5em] rounded border-0 p-[0.5em] text-center leading-[1.25] text-text transition-[color,background,opacity] duration-125 ease-in-out select-none",
      "focus-visible:shadow-[0_0_0_0.1rem_var(--bg-color),_0_0_0_0.2rem_var(--text-color)] focus-visible:outline-none",
      "bg-(--themable-button-bg) text-(--themable-button-text) hover:bg-(--themable-button-hover-bg) hover:text-(--themable-button-hover-text)",
      "[--themable-button-active:var(--main-color)]",
      variant() === "text" &&
        "[--themable-button-bg:transparent] [--themable-button-hover-bg:transparent] [--themable-button-hover-text:var(--text-color)] [--themable-button-text:var(--sub-color)] active:text-sub",
      variant() === "button" &&
        "[--themable-button-bg:var(--sub-alt-color)] [--themable-button-hover-bg:var(--text-color)] [--themable-button-hover-text:var(--bg-color)] [--themable-button-text:var(--text-color)] active:bg-sub",
      variant() === "button" &&
        isActive() &&
        "[--themable-button-bg:var(--themable-button-active)] [--themable-button-hover-bg:var(--text-color)] [--themable-button-hover-text:var(--bg-color)] [--themable-button-text:var(--bg-color)]",
      variant() === "text" &&
        isActive() &&
        "[--themable-button-hover-text:var(--themable-button-hover-text)] [--themable-button-text:var(--themable-button-active)]",
      !isAnchor() &&
        (props as ButtonProps).danger &&
        "[--themable-button-bg:var(--error-color)] [--themable-button-hover-bg:var(--text-color)] [--themable-button-hover-text:var(--bg-color)] [--themable-button-text:var(--bg-color)]",
      {
        "pointer-events-none opacity-[0.33]": props.disabled,
      },
      {
        [props.class ?? ""]: props.class !== undefined,
      },
    );
  };

  return (
    <Switch
      fallback={
        <button
          // oxlint-disable-next-line button-has-type
          type={(props as ButtonProps).type ?? "button"}
          id={props.id}
          class={getClasses()}
          onClick={(e) => props.onClick?.(e)}
          onMouseEnter={(e) => props.onMouseEnter?.(e)}
          onMouseLeave={(e) => props.onMouseLeave?.(e)}
          {...balloonHtmlProps()}
          disabled={props.disabled ?? false}
          data-ui-variant={variant()}
          data-ui-element="button"
          tabIndex={props.tabIndex ?? undefined}
          {...props.dataset}
        >
          {content}
        </button>
      }
    >
      <Match when={"to" in props && (props as LinkProps)}>
        {(linkProps) => (
          <Link
            id={props.id}
            class={getClasses()}
            to={linkProps().to}
            params={linkProps().params}
            {...balloonHtmlProps()}
            onClick={(e) => props.onClick?.(e)}
            onMouseEnter={(e) => props.onMouseEnter?.(e)}
            onMouseLeave={(e) => props.onMouseLeave?.(e)}
            data-ui-variant={variant()}
            data-ui-element="button"
            {...props.dataset}
          >
            {content}
          </Link>
        )}
      </Match>
      <Match when={"href" in props}>
        <a
          id={props.id}
          class={getClasses()}
          href={props.href}
          target={props.href?.startsWith("#") ? undefined : "_blank"}
          rel={props.href?.startsWith("#") ? undefined : "noreferrer noopener"}
          {...balloonHtmlProps()}
          onClick={(e) => props.onClick?.(e)}
          onMouseEnter={(e) => props.onMouseEnter?.(e)}
          onMouseLeave={(e) => props.onMouseLeave?.(e)}
          data-ui-variant={variant()}
          data-ui-element="button"
          {...props.dataset}
        >
          {content}
        </a>
      </Match>
    </Switch>
  );
}
