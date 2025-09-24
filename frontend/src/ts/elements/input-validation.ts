import { debounce } from "throttle-debounce";
import { z, ZodType } from "zod";
import { InputIndicator } from "./input-indicator";
import {
  ConfigKey,
  ConfigSchema,
  Config as ConfigType,
} from "@monkeytype/schemas/configs";
import Config, * as UpdateConfig from "../config";
import * as Notifications from "../elements/notifications";

export type ValidationResult = {
  status: "checking" | "success" | "failed" | "warning";
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
  isValid?: (value: T) => Promise<true | string | { warning: string }>;

  /** custom debounce delay for `isValid` call. defaults to 100 */
  debounceDelay?: number;

  /** Resets the value to the current config if empty */
  resetIfEmpty?: false;
};

// oxlint-disable-next-line no-explicit-any
export function debounceIfNeeded<T extends (...args: any[]) => any>(
  delay: number,
  callback: T
): T | debounce<T> {
  if (delay <= 0) {
    return callback;
  }
  return debounce(delay, callback);
}

/**
 * Create input handler for validated input element.
 * the `callback` is called for each validation state change, including "checking".
 * @param callback callback to call for each change of the validation status
 * @param validation validation options
 * @param inputValueConvert  convert method from string to the schema type, mandatory if the schema is not a string schema
 * @returns debounced input event handler
 */
export function createInputEventHandler<T>(
  callback: (result: ValidationResult) => void,
  validation: Validation<T>,
  inputValueConvert?: (val: string) => T
): (e: Event) => Promise<void> {
  let callIsValid =
    validation.isValid !== undefined
      ? debounceIfNeeded(
          validation.debounceDelay ?? 250,
          async (
            originalInput: HTMLInputElement,
            currentValue: string,
            checkValue: T
          ) => {
            const result = await validation.isValid?.(checkValue);
            if (originalInput.value !== currentValue) {
              //value has change in the meantime, discard result
              return;
            }

            if (result === true) {
              callback({ status: "success" });
            } else {
              if (typeof result === "object" && "warning" in result) {
                callback({
                  status: "warning",
                  errorMessage: result.warning,
                });
              } else {
                callback({
                  status: "failed",
                  errorMessage: result,
                });
              }
            }
          }
        )
      : undefined;

  return async (e) => {
    const originalInput = e.target as HTMLInputElement;
    const currentValue = originalInput.value;
    let checkValue: unknown = currentValue;

    if (inputValueConvert !== undefined) {
      checkValue = inputValueConvert(currentValue);
    }

    callback({ status: "checking" });

    if (validation.schema !== undefined) {
      const schemaResult = validation.schema.safeParse(checkValue);

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

    if (callIsValid === undefined) {
      callback({ status: "success" });
      //call original handler if defined
      originalInput.oninput?.(e);
      return;
    }

    await callIsValid(originalInput, currentValue, checkValue as T);
    //call original handler if defined
    originalInput.oninput?.(e);
  };
}

export type ValidationOptions<T> = (T extends string
  ? Validation<T>
  : Validation<T> & {
      /** convert string input. For `number`s use `Number` constructor  */
      inputValueConvert: (val: string) => T;
    }) & {
  /** optional callback is called for each change of the validation result */
  callback?: (result: ValidationResult) => void;
};

export type ValidatedHtmlInputElement = HTMLInputElement & {
  isValid: () => boolean | undefined;
  setValue: (val: string | null) => void;
  triggerValidation: () => void;
};
/**
 * adds an 'InputIndicator` to the given `inputElement` and updates its status depending on the given validation
 * @param inputElement
 * @param options
 */
export function validateWithIndicator<T>(
  inputElement: HTMLInputElement,
  options: ValidationOptions<T>
): ValidatedHtmlInputElement {
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
    warning: {
      icon: "fa-exclamation-triangle",
      level: 1,
    },
    checking: {
      icon: "fa-circle-notch",
      spinIcon: true,
      level: 0,
    },
  });

  let isValid: boolean | undefined = undefined;
  const callback = (result: ValidationResult): void => {
    isValid = result.status === "success" || result.status === "warning";
    if (result.status === "failed" || result.status === "warning") {
      indicator.show(result.status, result.errorMessage);
    } else {
      indicator.show(result.status);
    }
    options.callback?.(result);
  };

  const handler = createInputEventHandler(
    callback,
    options,
    "inputValueConvert" in options ? options.inputValueConvert : undefined
  );

  inputElement.addEventListener("input", handler);

  const result = inputElement as ValidatedHtmlInputElement;
  result.isValid = () => isValid;
  result.setValue = (val: string | null) => {
    inputElement.value = val ?? "";
    if (val === null) {
      isValid = undefined;
      indicator.hide();
    } else {
      inputElement.dispatchEvent(new Event("input"));
    }
  };
  result.triggerValidation = () => {
    inputElement.dispatchEvent(new Event("input"));
  };

  return result;
}

export type ConfigInputOptions<K extends ConfigKey, T = ConfigType[K]> = {
  input: HTMLInputElement | null;
  configName: K;
  validation?: (T extends string
    ? Omit<Validation<T>, "schema">
    : Omit<Validation<T>, "schema"> & {
        inputValueConvert: (val: string) => T;
      }) & {
    /**set to `true` to validate against the  `ConfigSchema`  */
    schema: boolean;
    /** optional callback is called for each change of the validation result */
    validationCallback?: (result: ValidationResult) => void;
  };
};

/**
 * Adds input event listeners to the given input element. On `focusOut` and when pressing `Enter` the current value is stored in the Config using  `genericSet`.
 * Note: Config is not updated if the value has not changed.
 *
 * If validation is set, Adds input validation using `InputIndicator` to the given input element. Config is only updated if the value is valid.
 *
 */
export function handleConfigInput<T extends ConfigKey>({
  input,
  configName,
  validation,
}: ConfigInputOptions<T, ConfigType[T]>): void {
  if (input === null) {
    throw new Error(`Failed to find input element for ${configName}`);
  }

  const inputValueConvert =
    validation !== undefined && "inputValueConvert" in validation
      ? validation.inputValueConvert
      : undefined;
  let status: ValidationResult["status"] = "checking";

  if (validation !== undefined) {
    const schema = ConfigSchema.shape[configName] as ZodType;

    validateWithIndicator(input, {
      schema: validation.schema ? schema : undefined,
      //@ts-expect-error this is fine
      isValid: validation.isValid,
      inputValueConvert,
      callback: (result) => {
        status = result.status;
      },
    });
  }

  const handleStore = (): void => {
    if (input.value === "" && (validation?.resetIfEmpty ?? true)) {
      //use last config value, clear validation
      input.value = new String(Config[configName]).toString();
      input.dispatchEvent(new Event("input"));
    }
    if (status === "failed") {
      const parent = $(input.parentElement as HTMLElement);
      parent
        .stop(true, true)
        .addClass("hasError")
        .animate({ undefined: 1 }, 500, () => {
          parent.removeClass("hasError");
        });
      return;
    }
    const value = (inputValueConvert?.(input.value) ??
      input.value) as ConfigType[T];

    if (Config[configName] === value) {
      return;
    }
    const didConfigSave = UpdateConfig.genericSet(configName, value, false);

    if (didConfigSave) {
      Notifications.add("Saved", 1, {
        duration: 1,
      });
    }
  };

  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      handleStore();
    }
  });
  input.addEventListener("focusout", (e) => handleStore());
}
