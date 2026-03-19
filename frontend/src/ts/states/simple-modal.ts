import { createSignal } from "solid-js";
import { z } from "zod";

import { showModal, hideModal } from "./modals";
import {
  addNotificationWithLevel,
  AddNotificationOptions,
  showErrorNotification,
} from "./notifications";
import { showLoaderBar, hideLoaderBar } from "./loader-bar";
import { IsValidResponse } from "../types/validation";

type CommonInput<TType, TValue> = {
  type: TType;
  name?: string;
  initVal?: TValue;
  placeholder?: string;
  hidden?: boolean;
  disabled?: boolean;
  optional?: boolean;
  label?: string;
  oninput?: (event: Event) => void;
  validation?: {
    schema?: z.Schema<string>;
    isValid?: (value: string) => Promise<IsValidResponse>;
    debounceDelay?: number;
  };
};

export type TextInput = CommonInput<"text", string>;
export type TextArea = CommonInput<"textarea", string>;
export type PasswordInput = CommonInput<"password", string>;
type EmailInput = CommonInput<"email", string>;

type RangeInput = {
  min: number;
  max: number;
  step?: number;
} & CommonInput<"range", number>;

type DateTimeInput = {
  min?: Date;
  max?: Date;
} & CommonInput<"datetime-local", Date>;

type DateInput = {
  min?: Date;
  max?: Date;
} & CommonInput<"date", Date>;

type CheckboxInput = {
  label: string;
  placeholder?: never;
  description?: string;
} & CommonInput<"checkbox", boolean>;

type NumberInput = {
  min?: number;
  max?: number;
} & CommonInput<"number", number>;

export type SimpleModalInput =
  | TextInput
  | TextArea
  | PasswordInput
  | EmailInput
  | RangeInput
  | DateTimeInput
  | DateInput
  | CheckboxInput
  | NumberInput;

export type ExecReturn = {
  status: "success" | "notice" | "error";
  message: string;
  showNotification?: false;
  notificationOptions?: AddNotificationOptions;
  afterHide?: () => void;
  alwaysHide?: boolean;
};

export type SimpleModalConfig = {
  title: string;
  inputs?: SimpleModalInput[];
  text?: string;
  textAllowHtml?: boolean;
  buttonText: string;
  execFn: (...inputValues: string[]) => Promise<ExecReturn>;
};

const [simpleModalConfig, setSimpleModalConfig] =
  createSignal<SimpleModalConfig | null>(null);

export { simpleModalConfig };

export function showSimpleModal(config: SimpleModalConfig): void {
  setSimpleModalConfig(config);
  showModal("SimpleModal");
}

export function hideSimpleModal(): void {
  hideModal("SimpleModal");
}

export async function executeSimpleModal(values: string[]): Promise<void> {
  const config = simpleModalConfig();
  if (config === null) return;

  showLoaderBar();
  try {
    const res = await config.execFn(...values);
    hideLoaderBar();

    if (res.showNotification !== false) {
      addNotificationWithLevel(
        res.message,
        res.status,
        res.notificationOptions,
      );
    }

    if (res.status === "success" || res.alwaysHide) {
      hideSimpleModal();
      res.afterHide?.();
    }
  } catch (error) {
    console.error("Error executing simple modal function:", error);
    showErrorNotification("An unexpected error occurred", {
      error,
    });
    hideLoaderBar();
  }
}
