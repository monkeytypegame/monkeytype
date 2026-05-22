import { createSignal } from "solid-js";

import { showModal, hideModal } from "./modals";
import { AddNotificationOptions } from "./notifications";

import { Validation } from "../types/validation";
import { z, ZodTypeAny } from "zod";

type InferSchema<T extends ZodTypeAny> = z.infer<T>;

type CommonInput<TType, TValue> = {
  type: TType;
  name?: string;
  initVal?: TValue;
  placeholder?: string;
  hidden?: boolean;
  disabled?: boolean;
  label?: string;
  class?: string;
  oninput?: (event: Event) => void;
  /**
   * preprocess is applied before validation and execFn
   * @param value
   * @returns
   */
  preprocess?: (value: TValue) => TValue;
  validation?: Omit<Validation<TValue>, "schema">;
};

// strings
type TextInput<T extends string> = {
  readOnly?: boolean;
  clickToSelect?: boolean;
} & CommonInput<"text", T>;

type TextArea<T extends string> = {
  readOnly?: boolean;
  clickToSelect?: boolean;
} & CommonInput<"textarea", T>;

type PasswordInput<T extends string> = CommonInput<"password", T>;
type EmailInput<T extends string> = CommonInput<"email", T>;

type StringTypeInput<T extends string> =
  | TextInput<T>
  | TextArea<T>
  | PasswordInput<T>
  | EmailInput<T>;

// numbers
type NumberInput<T extends number> = CommonInput<"number", T>;
type RangeInput<T extends number> = {
  step?: number;
} & CommonInput<"range", T>;

type NumberTypeInput<T extends number> = NumberInput<T> | RangeInput<T>;

// booleans
type CheckboxInput<T extends boolean> = {
  label: string;
  placeholder?: never;
  description?: string;
} & CommonInput<"checkbox", T>;

type BooleanTypeInput<T extends boolean> = CheckboxInput<T>;

// dates

type DateInput<T extends Date> = CommonInput<"date", T>;
type DateTimeInput<T extends Date> = CommonInput<"datetime-local", T>;
type DateTypeInput<T extends Date> = DateInput<T> | DateTimeInput<T>;

export type SimplerModalInput<T> = T extends string
  ? StringTypeInput<T>
  : T extends number
    ? NumberTypeInput<T>
    : T extends boolean
      ? BooleanTypeInput<T>
      : T extends Date
        ? DateTypeInput<T>
        : never;

// oxlint-disable-next-line typescript/no-explicit-any
export type GenericSimplerModalInput = SimplerModalInput<any>;

export type ExecReturn = {
  status: "success" | "notice" | "error";
  message: string;
  showNotification?: false;
  notificationOptions?: AddNotificationOptions;
  afterHide?: () => void;
  alwaysHide?: boolean;
};

// oxlint-disable-next-line typescript/no-explicit-any
export type InputsFromSchema<S extends z.ZodObject<any>> = {
  [K in keyof S["shape"]]: SimplerModalInput<z.infer<S["shape"][K]>>;
};

// oxlint-disable-next-line typescript/no-explicit-any
export type SimplerModalConfig<S extends z.ZodObject<any>> = {
  title: string;
  schema: S;
  inputs: InputsFromSchema<S>;
  text?: string;
  textClass?: string;
  textAllowHtml?: boolean;
  buttonText?: string;
  buttonAlwaysEnabled?: boolean;

  focusFirstInput?: true | "focusAndSelect";
  class?: string;

  execFn: (values: InferSchema<S>) => Promise<ExecReturn>;
};

const [simplerModalConfig, setSimplerModalConfig] =
  // oxlint-disable-next-line typescript/no-explicit-any
  createSignal<SimplerModalConfig<any> | null>(null);

export { simplerModalConfig };

// oxlint-disable-next-line typescript/no-explicit-any
export function showSimplerModal<T extends z.ZodObject<any>>(
  config: SimplerModalConfig<T>,
): void {
  setSimplerModalConfig(config);
  showModal("SimplerModal");
}

export function hideSimplerModal(): void {
  hideModal("SimplerModal");
}
