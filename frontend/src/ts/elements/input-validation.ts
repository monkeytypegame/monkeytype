import { debounce } from "throttle-debounce";
import { z } from "zod";
import { InputIndicator } from "./input-indicator";

export type ValidationResult = {
  status: "checking" | "success" | "failed";
  errorMessage?: string;
};

export type Validation<T> = {
  /**
   * Zod schema to validate the input value against.
   * The indicator will show the error messages from the schema.
   */
  schema?: z.Schema<T>;
  /**
   * Custom async validation method.
   * This is intended to be used for validations that cannot be handled with a Zod schema like server-side validations.
   * @param value current input value
   * @param thisPopup the current modal
   * @returns true if the `value` is valid, an errorMessage as string if it is invalid.
   */
  isValid?: (value: T) => Promise<true | string>;
};

export async function handleValidatedInputEvent<T>(
  e: InputEvent,
  callback: (result: ValidationResult) => void,
  options: Validation<T>,
  inputValueConvert?: (val: string) => T
): Promise<void> {
  const originalInput = e.target as HTMLInputElement;
  const currentValue = originalInput.value;
  let checkValue: unknown = currentValue;

  if (inputValueConvert !== undefined) {
    checkValue = inputValueConvert(currentValue);
  }

  callback({ status: "checking" });

  if (options.schema !== undefined) {
    const schemaResult = options.schema.safeParse(checkValue);

    if (!schemaResult.success) {
      callback({
        status: "failed",
        errorMessage: schemaResult.error.errors
          .map((err) => err.message)
          .join(", "),
      });
      return;
    }
  }

  if (options.isValid === undefined) {
    callback({ status: "success" });
    return;
  }

  const result = await options.isValid(checkValue as T);
  if (originalInput.value !== currentValue) {
    //value has change in the meantime, discard result
    return;
  }

  if (result === true) {
    callback({ status: "success" });
  } else {
    callback({
      status: "failed",
      errorMessage: result,
    });
  }
  //call original handler if defined
  originalInput.oninput?.(e);
}

export type ValidationOptions<T> = (T extends string
  ? Validation<T>
  : Validation<T> & {
      inputValueConvert: (val: string) => T;
    }) & { callback?: (result: ValidationResult) => void };

export function validateWithIndicator<T>(
  inputElement: HTMLInputElement,
  options: ValidationOptions<T>
): void {
  //use indicator
  const indicator = new InputIndicator(inputElement, {
    success: {
      icon: "fa-check",
      level: 1,
    },
    failed: {
      icon: "fa-times",
      level: -1,
    },
    checking: {
      icon: "fa-circle-notch",
      spinIcon: true,
      level: 0,
    },
  });
  const callback = (result: ValidationResult): void => {
    if (result.status === "failed") {
      indicator.show(result.status, result.errorMessage);
    } else {
      indicator.show(result.status);
    }
    options.callback?.(result);
  };

  inputElement.addEventListener(
    "input",
    debounce(100, async (e) => {
      return handleValidatedInputEvent(
        e as InputEvent,
        callback,
        options,
        "inputValueConvert" in options ? options.inputValueConvert : undefined
      );
    })
  );
}
