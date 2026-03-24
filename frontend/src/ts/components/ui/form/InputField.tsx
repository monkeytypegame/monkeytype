import { AnyFieldApi } from "@tanstack/solid-form";
import { Accessor, JSXElement, Show } from "solid-js";

import { cn } from "../../../utils/cn";
import { FieldIndicator } from "./FieldIndicator";

export function InputField(props: {
  field: Accessor<AnyFieldApi>;
  placeholder?: string;
  showIndicator?: boolean;
  autocomplete?: string;
  type?: string;
  disabled?: boolean;
  class?: string;
  dir?: "ltr" | "rtl" | "auto";
  maxLength?: number;
  onFocus?: () => void;
}): JSXElement {
  return (
    <div class="grid w-full">
      <input
        class={cn(
          "col-start-1 row-start-1 w-full",
          "rounded border-none bg-sub-alt p-[0.5em] text-em-base leading-[1.25em] caret-main outline-none",
          "focus-visible:shadow-[0_0_0_0.1rem_var(--bg-color),0_0_0_0.2rem_var(--text-color)]",
          "autofill-fix",
          props.showIndicator === true ? "pr-[1.85em]" : "",
          props.class,
        )}
        type={props.type ?? "text"}
        placeholder={props.placeholder ?? (props.field().name as string)}
        // oxlint-disable-next-line react/no-unknown-property
        autocomplete={props.autocomplete}
        name={props.field().name as string}
        value={props.field().state.value as string}
        onBlur={() => props.field().handleBlur()}
        onInput={(e) => props.field().handleChange(e.target.value)}
        disabled={props.disabled}
        onFocus={() => props.onFocus?.()}
        dir={props.dir}
        maxLength={props.maxLength}
      />
      <Show when={props.showIndicator}>
        <FieldIndicator field={props.field()} />
      </Show>
    </div>
  );
}
