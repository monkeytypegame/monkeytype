import { z } from "zod";

export type ValidationResult =
  | {
      status: "checking" | "failed" | "warning";
      errorMessage?: string;
      success: false;
    }
  | {
      status: "success";
      success: true;
    };

export type IsValidResponse = true | string | { warning: string };

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
  isValid?: (value: T) => Promise<IsValidResponse>;

  /** custom debounce delay for `isValid` call. defaults to 100 */
  debounceDelay?: number;
};
