import { JSXElement, Show } from "solid-js";
import { Conditional } from "./Conditional";

type BaseProps = {
  text?: string;
  icon?: string;
  fixedWidthIcon?: boolean;
  class?: string;
  type?: "text" | "button";
  children?: JSXElement;
};

type ButtonProps = BaseProps & {
  onClick: () => void;
  href?: never;
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
      <Show when={props.icon !== undefined}>
        <i
          class={`icon ${props.icon}`}
          classList={{
            "fa-fw": props.text === undefined || props.fixedWidthIcon === true,
          }}
        ></i>
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

  return (
    <Conditional
      if={isAnchor}
      then={
        <a
          classList={getClassList()}
          href={props.href}
          target="_blank"
          rel="noreferrer noopener"
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
