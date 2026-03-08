import {
  splitProps,
  createEffect,
  JSXElement,
  on,
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
    type?: string;
    autocomplete?: string;
    name?: string;
    onInput?: (value: T) => void;
    onFocus?: () => void;
    disabled?: boolean;
    revalidateOn?: () => unknown;
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

    const [_, others] = splitProps(props, [
      "value",
      "class",
      "placeholder",
      "type",
      "autocomplete",
      "name",
      "onFocus",
      "revalidateOn",
    ]);
    validatedInput = new ValidatedHtmlInputElement(
      element,
      others as ValidationOptions<T>,
    );
    validatedInput.setValue(props.value ?? null);
  });

  createEffect(
    on(
      () => props.revalidateOn?.(),
      () => {
        if (validatedInput && inputEl()?.getValue() !== "") {
          validatedInput.triggerValidation();
        }
      },
      { defer: true },
    ),
  );

  onCleanup(() => {
    validatedInput?.destroy();
  });

  return (
    <div class="inputAndIndicator">
      <input
        ref={inputRef}
        type={props.type ?? "text"}
        class={props.class}
        placeholder={props.placeholder}
        value={props.value ?? ""}
        disabled={props.disabled}
        // oxlint-disable-next-line react/no-unknown-property
        autocomplete={props.autocomplete}
        name={props.name}
        onInput={(e) => props.onInput?.(e.target.value as T)}
        onFocus={() => props.onFocus?.()}
      />
    </div>
  );
}
