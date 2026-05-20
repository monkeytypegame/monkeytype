import { AnyFieldApi } from "@tanstack/solid-form";
import { Accessor, JSXElement } from "solid-js";

import { cn } from "../../../utils/cn";
import { Fa } from "../../common/Fa";

export function Checkbox(props: {
  field: Accessor<AnyFieldApi>;
  label?: string | JSXElement;
  class?: string;
  disabled?: boolean;
}): JSXElement {
  const checked = () => props.field().state.value as boolean;

  return (
    <div>
      <label
        class={cn(
          "group flex cursor-pointer items-center gap-[0.5em] select-none",
          props.disabled && "pointer-events-none text-text/33",
          props.class,
        )}
      >
        <input
          id={props.field().name as string}
          name={props.field().name as string}
          onBlur={() => props.field().handleBlur()}
          onChange={(e) => props.field().handleChange(e.target.checked)}
          type="checkbox"
          checked={checked()}
          disabled={props.disabled}
          class="hidden"
        />
        <div
          class={cn(
            "duration-half relative grid h-[1.25em] w-[1.25em] shrink-0 place-items-center rounded-half bg-sub-alt transition-[background]",
            props.disabled && "opacity-[0.33]",
          )}
        >
          <Fa
            icon="fa-check"
            class={cn(
              "text-em-xs transition-[color] duration-125",
              checked()
                ? "text-main group-hover:text-text"
                : "text-transparent group-hover:text-bg",
            )}
          />
        </div>
        <div>{props.label}</div>
      </label>
    </div>
  );
}
