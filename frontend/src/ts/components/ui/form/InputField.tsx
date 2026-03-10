import { AnyFieldApi } from "@tanstack/solid-form";
import { Accessor, JSXElement, Show } from "solid-js";

import { cn } from "../../../utils/cn";
import { FieldIndicator } from "./FieldIndicator";

export function InputField(props: {
  field: Accessor<AnyFieldApi>;
  placeholder?: string;
  showIndicator?: true;
  autocomplete?: string;
  type?: string;
  disabled?: boolean;
  onFocus?: () => void;
}): JSXElement {
  return (
    <div class="grid w-full">
      <input
        class={cn(
          "col-start-1 row-start-1 w-full",
          props.showIndicator ? "pr-[1.85em]" : "",
        )}
        id={props.field().name as string}
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
      />
      <Show when={props.showIndicator}>
        <FieldIndicator field={props.field()} />
      </Show>
    </div>
  );
}
