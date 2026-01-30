import { JSXElement, Show } from "solid-js";

import { Conditional } from "./Conditional";
import { Fa, FaProps } from "./Fa";

type BaseProps = {
  text?: string;
  fa?: FaProps;
  class?: string;
  type?: "text" | "button";
  children?: JSXElement;
};

type ButtonProps = BaseProps & {
  onClick: () => void;
  href?: never;
  sameTarget?: true;
  label?: string | { text: string; position: "up" | "down" | "left" | "right" };
};

type AnchorProps = BaseProps & {
  href: string;
  onClick?: never;
};

export function Button(props: ButtonProps | AnchorProps): JSXElement {
  const isAnchor = "href" in props;
  const buttonClass = isAnchor ? "button" : "";

  const content = (
    <>
      <Show when={props.fa !== undefined}>
        <Fa {...(props.fa as FaProps)} />
      </Show>
      <Show when={props.text !== undefined}>{props.text}</Show>
      {props.children}
    </>
  );

  const getClassList = (): Record<string, boolean> => {
    return {
      [(props.type ?? "button") === "text" ? "textButton" : buttonClass]: true,
      [props.class ?? ""]: props.class !== undefined,
    };
  };

  const ariaLabel = (): object => {
    if (isAnchor) return {};
    if (props.label === undefined) return {};
    if (typeof props.label === "string") {
      return { "aria-label": props.label, "data-balloon-pos": "up" };
    }
    return {
      "aria-label": props.label.text,
      "data-balloon-pos": props.label.position,
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
            props.href?.startsWith("#") || props.href?.startsWith("/")
              ? undefined
              : "_blank"
          }
          rel={
            props.href?.startsWith("#") || props.href?.startsWith("/")
              ? undefined
              : "noreferrer noopener"
          }
          {...("router-link" in props ? { "router-link": "" } : {})}
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
        >
          {content}
        </button>
      }
    />
  );
}
