import { AnyFieldApi } from "@tanstack/solid-form";
import { Accessor, JSXElement } from "solid-js";

export function Checkbox(props: {
  field: Accessor<AnyFieldApi>;
  label?: string;

  disabled?: boolean;
}): JSXElement {
  return (
    <div>
      <label class="flex h-6 cursor-pointer items-center gap-2">
        <input
          id={props.field().name as string}
          name={props.field().name as string}
          onBlur={() => props.field().handleBlur()}
          onChange={(e) => props.field().handleChange(e.target.checked)}
          type="checkbox"
          checked={props.field().state.value as boolean}
          disabled={props.disabled}
        />
        <div>{props.label}</div>
      </label>
    </div>
  );
}
