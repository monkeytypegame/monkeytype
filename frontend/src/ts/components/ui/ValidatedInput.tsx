import {
  splitProps,
  createEffect,
  JSXElement,
  onCleanup,
  onMount,
} from "solid-js";

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
    onInput?: (value: T) => void;
  },
): JSXElement {
  // Refs are assigned by SolidJS via the ref attribute
  const [inputRef, inputEl] = useRefWithUtils<HTMLInputElement>();

  let validatedInput: ValidatedHtmlInputElement | undefined;

  createEffect(() => {
    validatedInput?.setValue(props.value ?? null);
  });

  onMount(() => {
    const element = inputEl();
    if (element === undefined) return;

    const [_, others] = splitProps(props, ["value", "class", "placeholder"]);
    validatedInput = new ValidatedHtmlInputElement(
      element,
      others as ValidationOptions<T>,
    );

    validatedInput.setValue(props.value ?? null);
  });

  onCleanup(() => validatedInput?.remove());
  return (
    <input
      ref={inputRef}
      type="text"
      class={props.class}
      placeholder={props.placeholder}
      value={props.value ?? ""}
      onInput={(e) => props.onInput?.(e.target.value as T)}
    />
  );
}
