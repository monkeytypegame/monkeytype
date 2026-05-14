import { AnyFieldApi } from "@tanstack/solid-form";
import { Accessor, createSignal, JSXElement, Show } from "solid-js";

import { cn } from "../../../utils/cn";
import { FieldIndicator } from "./FieldIndicator";

export function InputField(props: {
  field: Accessor<AnyFieldApi>;
  placeholder?: string;
  autocomplete?: string;
  type?: string;
  disabled?: boolean;
  readOnly?: boolean;
  clickToSelect?: boolean;
  class?: string;
  dir?: "ltr" | "rtl" | "auto";
  maxLength?: number;
  onFocus?: () => void;
}): JSXElement {
  const [shake, setShake] = createSignal(false);

  const shakeIt = () => {
    setShake(true);
    setTimeout(() => setShake(false), 300);
  };

  return (
    <div
      class="grid w-full"
      style={
        shake() ? { animation: "shake 0.1s ease-in-out infinite" } : undefined
      }
    >
      <input
        class={cn(
          "col-start-1 row-start-1 w-full",
          "rounded border-none bg-sub-alt p-[0.5em] text-em-base leading-[1.25em] caret-main outline-none",
          "focus-visible:shadow-[0_0_0_0.1rem_var(--bg-color),0_0_0_0.2rem_var(--text-color)]",
          "autofill-fix",
          props.field().options.validators ? "pr-[1.85em]" : "",
          props.class,
        )}
        type={props.type ?? "text"}
        placeholder={props.placeholder ?? ""}
        // oxlint-disable-next-line react/no-unknown-property
        autocomplete={props.autocomplete}
        name={props.field().name as string}
        value={props.field().state.value as string}
        onBlur={() => {
          props.field().handleBlur();
          if (!props.field().state.meta.isValid) {
            shakeIt();
          }
        }}
        onInput={(e) => props.field().handleChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            if (!props.field().state.meta.isValid) {
              shakeIt();
            }
          }
        }}
        disabled={props.disabled}
        readOnly={props.readOnly}
        onClick={(e) => {
          if (props.clickToSelect) e.currentTarget.select();
        }}
        onFocus={() => props.onFocus?.()}
        dir={props.dir}
        maxLength={props.maxLength}
      />
      <Show when={props.field().options.validators}>
        <FieldIndicator field={props.field()} />
      </Show>
    </div>
  );
}
