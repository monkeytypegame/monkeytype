import { JSX, JSXElement, Show } from "solid-js";

import { Conditional } from "./Conditional";
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
};

type ButtonProps = BaseProps & {
  onClick: () => void;
  href?: never;
  sameTarget?: true;
  active?: boolean;
  disabled?: boolean;
};

type AnchorProps = BaseProps & {
  href: string;
  onClick?: never;
  disabled?: never;
};

export function Button(props: ButtonProps | AnchorProps): JSXElement {
  const isAnchor = "href" in props;
  const buttonClass = isAnchor ? "button" : "";
  const isActive = (): boolean => (!isAnchor && props.active) ?? false;

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

  const getClassList = (): Record<string, boolean | undefined> => {
    return {
      [(props.type ?? "button") === "text" ? "textButton" : buttonClass]: true,
      [props.class ?? ""]: props.class !== undefined,
      "bg-main": isActive(),
      "text-bg": isActive(),
      "hover:bg-text": isActive(),
      ...props.classList,
    };
  };

  return (
    <Conditional
      if={isAnchor}
      then={
        <a
          classList={getClassList()}
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
        >
          {content}
        </a>
      }
      else={
        <button
          type="button"
          classList={getClassList()}
          onClick={() => props.onClick?.()}
          {...ariaLabel()}
          {...(props["router-link"] ? { "router-link": "" } : {})}
          disabled={props.disabled ?? false}
        >
          {content}
        </button>
      }
    />
  );
}
