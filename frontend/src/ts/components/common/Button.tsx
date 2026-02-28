import { JSX, JSXElement, Show } from "solid-js";

import { cn } from "../../utils/cn";
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

  const getClasses = (): string => {
    return cn(
      "inline-flex h-min cursor-pointer appearance-none items-center justify-center gap-[0.5em] rounded border-0 p-[0.5em] text-center leading-[1.25] text-text transition-colors transition-opacity duration-125 ease-in-out select-none",
      "focus-visible:shadow-[0_0_0_0.1rem_var(--bg-color),_0_0_0_0.2rem_var(--text-color)] focus-visible:outline-none",
      {
        "bg-sub-alt hover:bg-text hover:text-bg": props.type !== "text",
        "bg-transparent text-sub hover:text-text": props.type === "text",
        [props.class ?? ""]: props.class !== undefined,
        "bg-main text-bg hover:bg-text": isActive(),

        ...props.classList,
      },
      {
        "opacity-[0.33]": props.disabled,
        "bg-text text-bg": isActive() && props.disabled,
      },
    );
  };

  return (
    <Conditional
      if={isAnchor}
      then={
        <a
          class={getClasses()}
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
          class={getClasses()}
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
