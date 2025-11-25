import { Config as ConfigType, ConfigKey } from "@monkeytype/schemas/configs";

import Config from "../../config";
import * as Notifications from "../notifications";
import SlimSelect from "slim-select";
import { debounce } from "throttle-debounce";
import {
  handleConfigInput,
  ConfigInputOptions,
  Validation,
} from "../input-validation";
import { ElementWithUtils, qs, qsa } from "../../utils/dom";

type Mode = "select" | "button" | "range" | "input";

export type SimpleValidation<T> = Omit<Validation<T>, "schema"> & {
  schema?: true;
};

export default class SettingsGroup<K extends ConfigKey, T = ConfigType[K]> {
  public configName: K;
  public configFunction: (param: T, nosave?: boolean) => boolean;
  public mode: Mode;
  public setCallback?: () => void;
  public updateCallback?: () => void;
  private elements: ElementWithUtils[];
  private validation?: T extends string
    ? SimpleValidation<T>
    : SimpleValidation<T> & {
        inputValueConvert: (val: string) => T;
      };

  constructor(
    configName: K,
    configFunction: (param: T, nosave?: boolean) => boolean,
    mode: Mode,
    options?: {
      setCallback?: () => void;
      updateCallback?: () => void;
      validation?: T extends string
        ? SimpleValidation<T>
        : SimpleValidation<T> & {
            inputValueConvert: (val: string) => T;
          };
    }
  ) {
    this.configName = configName;
    this.mode = mode;
    this.configFunction = configFunction;
    this.setCallback = options?.setCallback;
    this.updateCallback = options?.updateCallback;
    this.validation = options?.validation;

    const convertValue = (value: string): T => {
      let typed = value as T;
      if (
        this.validation !== undefined &&
        "inputValueConvert" in this.validation
      ) {
        typed = this.validation.inputValueConvert(value);
      }
      if (typed === "true") typed = true as T;
      if (typed === "false") typed = false as T;

      return typed;
    };

    if (this.mode === "select") {
      const el = qs<HTMLSelectElement>(
        `.pageSettings .section[data-config-name=${this.configName}] select`
      );

      if (el === null) {
        throw new Error(`Failed to find select element for ${configName}`);
      }

      if (el.hasAttribute("multiple")) {
        throw new Error(
          "multi-select dropdowns not supported. Config: " + this.configName
        );
      }

      el.on("change", (e) => {
        if (
          e.target instanceof HTMLElement &&
          (e.target?.classList?.contains("disabled") ||
            e.target?.classList?.contains("no-auto-handle"))
        ) {
          return;
        }

        this.setValue(el.getValue() as T);
      });

      this.elements = [el];
    } else if (this.mode === "button") {
      const els = qsa<HTMLButtonElement>(`
        .pageSettings .section[data-config-name=${this.configName}] .buttons button, .pageSettings .section[data-config-name=${this.configName}] .inputs button`);

      if (els.length === 0) {
        throw new Error(`Failed to find a button element for ${configName}`);
      }

      for (const button of els) {
        button.on("click", (e) => {
          if (
            button.hasClass("disabled") ||
            button.hasClass("no-auto-handle")
          ) {
            return;
          }

          let value = button.getAttribute("data-config-value");
          if (value === null || value === "") {
            console.error(
              `Failed to handle settings button click for ${configName}: data-${configName} is missing or empty.`
            );
            Notifications.add(
              "Button is missing data property. Please report this.",
              -1
            );
            return;
          }

          let typed = convertValue(value);
          this.setValue(typed);
        });
      }

      this.elements = Array.from(els);
    } else if (this.mode === "input") {
      const input = qs<HTMLInputElement>(`
        .pageSettings .section[data-config-name=${this.configName}] .inputs .inputAndButton input`);
      if (input === null) {
        throw new Error(`Failed to find input element for ${configName}`);
      }

      let validation;
      if (this.validation !== undefined) {
        validation = {
          schema: this.validation.schema ?? false,
          isValid: this.validation.isValid,
          inputValueConvert:
            "inputValueConvert" in this.validation
              ? this.validation.inputValueConvert
              : undefined,
        };
      }

      handleConfigInput({
        input,
        configName: this.configName,
        validation,
      } as ConfigInputOptions<K>);

      this.elements = [input];
    } else if (this.mode === "range") {
      const el = qs<HTMLInputElement>(
        `.pageSettings .section[data-config-name=${this.configName}] input[type=range]`
      );

      if (el === null) {
        throw new Error(`Failed to find range element for ${configName}`);
      }

      const debounced = debounce<(val: T) => void>(250, (val) => {
        this.setValue(val);
      });

      el.on("input", (e) => {
        if (el.hasClass("disabled") || el.hasClass("no-auto-handle")) {
          return;
        }
        const val = parseFloat(el.getValue()) as T;
        this.updateUI(val);
        debounced(val);
      });

      this.elements = [el];
    } else {
      this.elements = [];
    }

    if (this.elements.length === 0 || this.elements === undefined) {
      throw new Error(
        `Failed to find elements for ${configName} with mode ${mode}`
      );
    }

    this.updateUI();
  }

  setValue(value: T): boolean {
    if (Config[this.configName] === value) {
      return false;
    }
    const didSet = this.configFunction(value);
    this.updateUI();
    if (this.setCallback) this.setCallback();
    return didSet;
  }

  updateUI(valueOverride?: T): void {
    const newValue = valueOverride ?? (Config[this.configName] as T);

    if (this.mode === "select") {
      const select = this.elements?.[0] as HTMLSelectElement | null | undefined;
      if (!select) {
        return;
      }

      //@ts-expect-error this is fine, slimselect adds slim to the element
      const ss = select.slim as SlimSelect | undefined;
      if (ss !== undefined) {
        const currentSelected = ss.getSelected()[0] ?? null;
        if (newValue !== currentSelected) {
          ss.setSelected(newValue as string);
        }
      } else {
        if (select.value !== newValue) select.value = newValue as string;
      }
    } else if (this.mode === "button") {
      for (const button of this.elements) {
        let value = button.getAttribute("data-config-value");

        let typed = value as T;
        if (typed === "true") typed = true as T;
        if (typed === "false") typed = false as T;

        if (typed !== newValue) {
          button.removeClass("active");
        } else {
          button.addClass("active");
        }
      }
    } else if (this.mode === "range") {
      const range = this.elements?.[0] as HTMLInputElement | null | undefined;

      const rangeValue = document.querySelector(
        `.pageSettings .section[data-config-name='${this.configName}'] .value`
      );

      if (range === undefined || range === null || rangeValue === null) {
        return;
      }

      range.value = newValue as unknown as string;
      rangeValue.textContent = `${(newValue as number).toFixed(1)}`;
    }
    if (this.updateCallback) this.updateCallback();
  }
}
