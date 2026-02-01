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
};

type ButtonProps = BaseProps & {
  onClick: () => void;
  href?: never;
  sameTarget?: true;
  active?: boolean;
};

type AnchorProps = BaseProps & {
  href: string;
  onClick?: never;
};

export function Button(props: ButtonProps | AnchorProps): JSXElement {
  const isAnchor = "href" in props;
  const buttonClass = isAnchor ? "button" : "";
  const isActive = (!isAnchor && props.active) ?? false;

  const content = (
    <>
      <Show when={props.fa !== undefined}>
        <Fa {...(props.fa as FaProps)} />
      </Show>
      <Show when={props.text !== undefined}>{props.text}</Show>
      {props.children}
    </>
  );

  const getClassList = (): Record<string, boolean | undefined> => {
    return {
      [(props.type ?? "button") === "text" ? "textButton" : buttonClass]: true,
      [props.class ?? ""]: props.class !== undefined,
      "bg-main": isActive,
      "text-bg": isActive,
      "hover:bg-text": isActive,
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
          target={props.href?.startsWith("#") ? undefined : "_blank"}
          rel={props.href?.startsWith("#") ? undefined : "noreferrer noopener"}
        >
          {content}
        </a>
      }
      else={
        <button
          type="button"
          classList={getClassList()}
          onClick={() => props.onClick?.()}
        >
          {content}
        </button>
      }
    />
  );
}
