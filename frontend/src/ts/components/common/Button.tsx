import { JSX, JSXElement, Match, Show, Switch } from "solid-js";

import { Fa, FaProps } from "./Fa";

type BaseProps = {
  text?: string;
  fa?: FaProps;
  class?: string;
  classList?: JSX.HTMLAttributes<HTMLButtonElement>["classList"];
  type?: "text" | "button";
  children?: JSXElement;
  ariaLabel?:
    | string
    | { text: string; position: "up" | "down" | "left" | "right" };
  "router-link"?: true;
  ref?: (el: HTMLElement) => void;
};

type ButtonProps = BaseProps & {
  onClick: () => void;
  href?: never;
  routerLink?: never;
  active?: boolean;
  disabled?: boolean;
};

type AnchorProps = BaseProps & {
  onClick?: never;
  href: string;
  routerLink?: never;
};

type RouterProps = BaseProps & {
  onClick?: () => void;
  href?: never;
  routerLink: string;
  disabled?: never;
};

export function Button(
  props: ButtonProps | AnchorProps | RouterProps,
): JSXElement {
  const isAnchor = "href" in props;
  const isActive = (): boolean =>
    (!isAnchor && "active" in props && props.active) ?? false;

  const content = (
    <>
      <Show when={props.fa !== undefined}>
        <Fa {...(props.fa as FaProps)} />
      </Show>
      <Show when={props.text !== undefined}>{props.text}</Show>
      {props.children}
    </>
  );

  const ariaLabel = (): object => {
    if (props.ariaLabel === undefined) return {};
    if (typeof props.ariaLabel === "string") {
      return { "aria-label": props.ariaLabel, "data-balloon-pos": "up" };
    }
    return {
      "aria-label": props.ariaLabel.text,
      "data-balloon-pos": props.ariaLabel.position,
    };
  };

  const getClassList = (
    defaultClass: string,
  ): Record<string, boolean | undefined> => {
    return {
      [(props.type ?? "button") === "text" ? "textButton" : defaultClass]: true,
      [props.class ?? ""]: props.class !== undefined,
      "bg-main": isActive(),
      "text-bg": isActive(),
      "hover:bg-text": isActive(),
      ...props.classList,
    };
  };

  return (
    <Switch>
      <Match when={"href" in props}>
        <a
          classList={getClassList("")}
          href={props.href}
          target={
            props["router-link"] || props.href?.startsWith("#")
              ? undefined
              : "_blank"
          }
          rel={
            props["router-link"] || props.href?.startsWith("#")
              ? undefined
              : "noreferrer noopener"
          }
          {...ariaLabel()}
          {...(props["router-link"] ? { "router-link": "" } : {})}
          ref={props.ref}
        >
          {content}
        </a>
      </Match>
      <Match when={"routerLink" in props}>
        <a
          classList={getClassList("")}
          href={props.routerLink}
          router-link
          onClick={() => {
            props.onClick?.();
          }}
          ref={props.ref}
        >
          {content}
        </a>
      </Match>
      <Match when={"onClick" in props}>
        <button
          type="button"
          classList={getClassList("")}
          onClick={() => {
            props.onClick?.();
          }}
          ref={props.ref}
          {...ariaLabel()}
          {...(props["router-link"] ? { "router-link": "" } : {})}
          disabled={("disabled" in props && props.disabled) ?? false}
        >
          {content}
        </button>
      </Match>
    </Switch>
  );
}
