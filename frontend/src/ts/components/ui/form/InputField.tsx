import { AnyFieldApi } from "@tanstack/solid-form";
import { Accessor, JSXElement, Show } from "solid-js";

import { FieldIndicator } from "./FieldIndicator";

export function InputField(props: {
  field: Accessor<AnyFieldApi>;
  placeholder?: string;
  showIndicator?: true;
  autocomplete?: string;
  type?: string;
  disabled?: boolean;
}): JSXElement {
  return (
    <div class="flex flex-row">
      <input
        id={props.field().name}
        type={props.type ?? "text"}
        placeholder={props.placeholder ?? props.field().name}
        // oxlint-disable-next-line react/no-unknown-property
        autocomplete={props.autocomplete}
        name={props.field().name}
        value={props.field().state.value}
        onBlur={() => props.field().handleBlur()}
        onInput={(e) => props.field().handleChange(e.target.value)}
        disabled={props.disabled}
      />
      <Show when={props.showIndicator}>
        <FieldIndicator field={props.field()} />
      </Show>
    </div>
  );
}
