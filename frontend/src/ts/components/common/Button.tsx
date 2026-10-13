import { JSX, JSXElement, Match, Show, splitProps, Switch } from "solid-js";

import { cn } from "../../utils/cn";
import { BalloonProps, buildBalloonHtmlProperties } from "./Balloon";
import { Fa, FaProps } from "./Fa";
import { withLink } from "./withLink";

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

type ButtonLinkStyleProps = Omit<BaseProps, "type" | "active"> & {
  /** Style the link as active while its route is the current location. */
  showActive?: boolean;
};

type ButtonAnchorProps = ButtonLinkStyleProps &
  Omit<JSX.AnchorHTMLAttributes<HTMLAnchorElement>, keyof BaseProps>;

function getButtonClasses(options: {
  variant: "text" | "button";
  active: boolean;
  danger?: boolean;
  disabled?: boolean;
  class?: string;
}): string {
  const { variant, active } = options;
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
    options.danger &&
      "[--themable-button-bg:var(--error-color)] [--themable-button-hover-bg:var(--text-color)] [--themable-button-hover-text:var(--bg-color)] [--themable-button-text:var(--bg-color)]",
    {
      "pointer-events-none opacity-[0.33]": options.disabled,
    },
    {
      [options.class ?? ""]: options.class !== undefined,
    },
  );
}

function ButtonContent(props: {
  fa?: FaProps;
  text?: string;
  children?: JSXElement;
}): JSXElement {
  return (
    <>
      <Show when={props.fa !== undefined}>
        <Fa {...(props.fa as FaProps)} />
      </Show>
      <Show when={props.text !== undefined}>{props.text}</Show>
      {props.children}
    </>
  );
}

/** The anchor rendered by `ButtonLink` - receives href, handlers and data-status from the router. */
function ButtonAnchor(props: ButtonAnchorProps): JSXElement {
  const [local, rest] = splitProps(props, [
    "text",
    "fa",
    "class",
    "variant",
    "children",
    "balloon",
    "dataset",
    "showActive",
  ]);
  const variant = () => local.variant ?? "button";

  return (
    <a
      {...rest}
      class={getButtonClasses({
        variant: variant(),
        active:
          (local.showActive ?? false) &&
          (rest as Record<string, unknown>)["data-status"] === "active",
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

/**
 * A button, an external link (`href`), or an in-app link (`to`, see
 * withLink). An in-app link gets `data-status="active"` while its route is
 * the current location (exact path, search ignored, unless `activeOptions`
 * says otherwise).
 */
export const Button = withLink(PlainButton, ButtonAnchor, {
  activeOptions: { exact: true, includeSearch: false },
});

function PlainButton(props: ButtonProps | AnchorProps): JSXElement {
  const isAnchor = (): boolean => "href" in props;
  const variant = () => props.variant ?? "button";

  const balloonHtmlProps = () => buildBalloonHtmlProperties(props.balloon);

  const getClasses = (): string =>
    getButtonClasses({
      variant: variant(),
      active: (!isAnchor() && props.active) ?? false,
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
          tabIndex={props.tabIndex ?? undefined}
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
