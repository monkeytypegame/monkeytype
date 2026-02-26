import { createEffect, JSXElement, onMount } from "solid-js";

import {
  ValidatedHtmlInputElement,
  ValidationOptions,
} from "../../elements/input-validation";
import { useRefWithUtils } from "../../hooks/useRefWithUtils";

export function ValidatedInput<T = string>(
  props: ValidationOptions<T> & {
    value?: string;
    placeholder?: string;
    class?: string;
  },
): JSXElement {
  // Refs are assigned by SolidJS via the ref attribute
  const [inputRef, inputEl] = useRefWithUtils<HTMLInputElement>();

  createEffect(() => {
    validatedInput?.setValue(props.value ?? null);
  });

  let validatedInput: ValidatedHtmlInputElement | undefined;

  onMount(() => {
    // oxlint-disable-next-line typescript/no-non-null-assertion
    validatedInput = new ValidatedHtmlInputElement(inputEl()!, {
      ...props,
    });
  });
  return (
    <input
      ref={inputRef}
      type="text"
      class={props.class}
      placeholder={props.placeholder}
      value={props.value ?? ""}
    />
  );
}
