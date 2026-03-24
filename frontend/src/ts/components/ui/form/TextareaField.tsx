import { AnyFieldApi } from "@tanstack/solid-form";
import { Accessor, JSXElement } from "solid-js";

import { cn } from "../../../utils/cn";

export function TextareaField(props: {
  field: Accessor<AnyFieldApi>;
  ref?: HTMLTextAreaElement | ((el: HTMLTextAreaElement) => void);
  placeholder?: string;
  disabled?: boolean;
  class?: string;
  onKeyDown?: (e: KeyboardEvent) => void;
  onKeyPress?: (e: KeyboardEvent) => void;
}): JSXElement {
  return (
    <textarea
      ref={props.ref}
      class={cn(
        "w-full resize-y",
        "rounded border-none bg-sub-alt p-[0.5em] text-em-base leading-[1.25em] caret-main outline-none",
        "focus-visible:shadow-[0_0_0_0.1rem_var(--bg-color),0_0_0_0.2rem_var(--text-color)]",
        props.class,
      )}
      id={props.field().name as string}
      name={props.field().name as string}
      placeholder={props.placeholder ?? (props.field().name as string)}
      value={props.field().state.value as string}
      onBlur={() => props.field().handleBlur()}
      onInput={(e) => props.field().handleChange(e.currentTarget.value)}
      disabled={props.disabled}
      onKeyDown={(e) => props.onKeyDown?.(e)}
      onKeyPress={(e) => props.onKeyPress?.(e)}
    ></textarea>
  );
}
