import { JSXElement, Match, Show, Switch } from "solid-js";

type BaseProps = {
  text?: string;
  icon?: string;
  iconScale?: number;
  fixedWidthIcon?: boolean;
  class?: string;
  type?: "text" | "button";
  children?: JSXElement;
  ref?: (el: HTMLElement) => void;
};

type ButtonProps = BaseProps & {
  onClick: () => void;
  href?: never;
  routerLink?: never;
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
};

export function Button(
  props: ButtonProps | AnchorProps | RouterProps,
): JSXElement {
  const content = (
    <>
      <Show when={props.icon !== undefined}>
        <i
          class={`icon ${props.icon}`}
          style={{
            "font-size": `${props.iconScale ?? 1}em`,
          }}
          classList={{
            "fa-fw": props.text === undefined || props.fixedWidthIcon === true,
          }}
        ></i>
      </Show>
      <Show when={props.text !== undefined}>{props.text}</Show>
      {props.children}
    </>
  );

  const getClassList = (defaultClass: string): Record<string, boolean> => {
    return {
      [(props.type ?? "button") === "text" ? "textButton" : defaultClass]: true,
      [props.class ?? ""]: props.class !== undefined,
    };
  };

  return (
    <Switch>
      <Match when={"href" in props}>
        <a
          classList={getClassList("")}
          href={props.href}
          target={props.href?.startsWith("#") ? undefined : "_blank"}
          rel={props.href?.startsWith("#") ? undefined : "noreferrer noopener"}
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
          onClick={props.onClick}
          ref={props.ref}
        >
          {content}
        </a>
      </Match>
      <Match when={"onClick" in props}>
        <button
          type="button"
          classList={getClassList("")}
          onClick={props.onClick}
          ref={props.ref}
        >
          {content}
        </button>
      </Match>
    </Switch>
  );
}
