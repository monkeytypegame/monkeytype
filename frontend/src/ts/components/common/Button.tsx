import {
  createLink,
  LinkComponent,
  LinkComponentProps,
  RegisteredRouter,
} from "@tanstack/solid-router";
import { JSX, JSXElement, Match, Show, splitProps, Switch } from "solid-js";

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
  onMouseEnter?: (e: MouseEvent) => void;
  onMouseLeave?: (e: MouseEvent) => void;
  dataset?: Record<string, string>;
  tabIndex?: number | string;
  id?: string;
};

export type ButtonProps = BaseProps & {
  type?: "button" | "submit" | "reset";
  href?: never;
  to?: never;
  active?: boolean;
  disabled?: boolean;
  danger?: boolean;
};

/** External link, opens in a new tab (unless it's a `#` anchor). */
type AnchorProps = BaseProps & {
  href: string;
  to?: never;
  active?: never;
  disabled?: never;
  type?: never;
};

type ButtonAnchorProps = BaseProps &
  Omit<JSX.AnchorHTMLAttributes<HTMLAnchorElement>, keyof BaseProps>;

function getButtonClasses(options: {
  variant: "text" | "button";
  active: boolean;
  danger?: boolean;
  disabled?: boolean;
  class?: string;
}): string {
  const { variant, active, danger, disabled } = options;
  return cn(
    "inline-flex h-min cursor-pointer appearance-none items-center justify-center gap-[0.5em] rounded border-0 p-[0.5em] text-center leading-[1.25] text-text transition-[color,background,opacity] duration-125 ease-in-out select-none",
    "focus-visible:shadow-[0_0_0_0.1rem_var(--bg-color),_0_0_0_0.2rem_var(--text-color)] focus-visible:outline-none",
    "bg-(--themable-button-bg) text-(--themable-button-text) hover:bg-(--themable-button-hover-bg) hover:text-(--themable-button-hover-text)",
    "[--themable-button-active:var(--main-color)]",
    variant === "text" &&
      "[--themable-button-bg:transparent] [--themable-button-hover-bg:transparent] [--themable-button-hover-text:var(--text-color)] [--themable-button-text:var(--sub-color)] active:text-sub",
    variant === "button" &&
      "[--themable-button-bg:var(--sub-alt-color)] [--themable-button-hover-bg:var(--text-color)] [--themable-button-hover-text:var(--bg-color)] [--themable-button-text:var(--text-color)] active:bg-sub",
    variant === "button" &&
      active &&
      "[--themable-button-bg:var(--themable-button-active)] [--themable-button-hover-bg:var(--text-color)] [--themable-button-hover-text:var(--bg-color)] [--themable-button-text:var(--bg-color)]",
    variant === "text" &&
      active &&
      "[--themable-button-hover-text:var(--themable-button-hover-text)] [--themable-button-text:var(--themable-button-active)]",
    danger &&
      "[--themable-button-bg:var(--error-color)] [--themable-button-hover-bg:var(--text-color)] [--themable-button-hover-text:var(--bg-color)] [--themable-button-text:var(--bg-color)]",
    disabled && "pointer-events-none opacity-[0.33]",
    options.class,
  );
}

function ButtonContent(props: {
  fa?: FaProps;
  text?: string;
  children?: JSXElement;
}): JSXElement {
  return (
    <>
      <Show when={props.fa}>{(fa) => <Fa {...fa()} />}</Show>
      {props.text}
      {props.children}
    </>
  );
}

/** The anchor rendered by `ButtonLink` - receives href and handlers from the router. */
function ButtonAnchor(props: ButtonAnchorProps): JSXElement {
  const [local, rest] = splitProps(props, [
    "text",
    "fa",
    "class",
    "variant",
    "children",
    "balloon",
    "dataset",
  ]);
  const variant = () => local.variant ?? "button";

  return (
    <a
      {...rest}
      class={getButtonClasses({
        variant: variant(),
        active: false,
        class: local.class,
      })}
      {...buildBalloonHtmlProperties(local.balloon)}
      data-ui-variant={variant()}
      data-ui-element="button"
      {...local.dataset}
    >
      <ButtonContent fa={local.fa} text={local.text}>
        {local.children}
      </ButtonContent>
    </a>
  );
}

const ButtonLink = createLink(ButtonAnchor);

type ButtonLinkProps = LinkComponentProps<
  typeof ButtonAnchor,
  RegisteredRouter,
  string,
  undefined,
  string,
  ""
>;

/**
 * A button, an external link (`href`), or an in-app link (`to`): a real
 * anchor (href, cmd/ctrl+click opens a new tab) navigating through the
 * router with typed `to`, `params` and `search`.
 *
 * The call signatures are an intersection type rather than `function`
 * overloads: the dev-only solid-refresh transform rewrites component
 * declarations to `const`, which breaks overload signatures.
 */
export const Button = ((
  props: ButtonProps | AnchorProps | ButtonLinkProps,
): JSXElement => (
  <Show
    when={"to" in props}
    fallback={<PlainButton {...(props as ButtonProps | AnchorProps)} />}
  >
    <ButtonLink {...(props as ButtonLinkProps)} />
  </Show>
)) as ((props: (ButtonProps | AnchorProps) & { to?: never }) => JSXElement) &
  LinkComponent<typeof ButtonAnchor>;

function PlainButton(props: ButtonProps | AnchorProps): JSXElement {
  const isAnchor = (): boolean => "href" in props;
  const isExternal = (): boolean =>
    !(props as AnchorProps).href.startsWith("#");
  const variant = () => props.variant ?? "button";

  const balloonHtmlProps = () => buildBalloonHtmlProperties(props.balloon);

  const getClasses = (): string =>
    getButtonClasses({
      variant: variant(),
      active: !isAnchor() && props.active === true,
      danger: !isAnchor() && (props as ButtonProps).danger,
      disabled: props.disabled,
      class: props.class,
    });

  const content = (
    <ButtonContent fa={props.fa} text={props.text}>
      {props.children}
    </ButtonContent>
  );

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
          tabIndex={props.tabIndex}
          {...props.dataset}
        >
          {content}
        </button>
      }
    >
      <Match when={isAnchor()}>
        <a
          id={props.id}
          class={getClasses()}
          href={props.href}
          target={isExternal() ? "_blank" : undefined}
          rel={isExternal() ? "noreferrer noopener" : undefined}
          {...balloonHtmlProps()}
          onClick={(e) => props.onClick?.(e)}
          onMouseEnter={(e) => props.onMouseEnter?.(e)}
          onMouseLeave={(e) => props.onMouseLeave?.(e)}
          data-ui-variant={variant()}
          data-ui-element="button"
          tabIndex={props.tabIndex}
          {...props.dataset}
        >
          {content}
        </a>
      </Match>
    </Switch>
  );
}
