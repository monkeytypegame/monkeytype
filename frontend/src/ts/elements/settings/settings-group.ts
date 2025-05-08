import { ConfigValue } from "@monkeytype/contracts/schemas/configs";
import Config from "../../config";
import * as Notifications from "../notifications";
import SlimSelect from "slim-select";
import { debounce } from "throttle-debounce";

type Mode = "select" | "button" | "range";

export default class SettingsGroup<T extends ConfigValue> {
  public configName: string;
  public configFunction: (param: T, nosave?: boolean) => boolean;
  public mode: Mode;
  public setCallback?: () => void;
  public updateCallback?: () => void;
  private elements: Element[];

  constructor(
    configName: string,
    configFunction: (param: T, nosave?: boolean) => boolean,
    mode: Mode,
    setCallback?: () => void,
    updateCallback?: () => void
  ) {
    this.configName = configName;
    this.mode = mode;
    this.configFunction = configFunction;
    this.setCallback = setCallback;
    this.updateCallback = updateCallback;

    if (this.mode === "select") {
      const el = document.querySelector(
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

      el.addEventListener("change", (e) => {
        const target = $(e.target as HTMLSelectElement);
        if (target.hasClass("disabled") || target.hasClass("no-auto-handle")) {
          return;
        }

        this.setValue(target.val() as T);
      });

      this.elements = [el];
    } else if (this.mode === "button") {
      const els = document.querySelectorAll(`
        .pageSettings .section[data-config-name=${this.configName}] button`);

      if (els.length === 0) {
        throw new Error(`Failed to find a button element for ${configName}`);
      }

      for (const button of els) {
        button.addEventListener("click", (e) => {
          if (
            button.classList.contains("disabled") ||
            button.classList.contains("no-auto-handle")
          ) {
            return;
          }
          const value = button.getAttribute("data-config-value");
          if (value === undefined || value === "") {
            console.error(
              `Failed to handle settings button click for ${configName}: data-${configName} is missing or empty.`
            );
            Notifications.add(
              "Button is missing data property. Please report this.",
              -1
            );
            return;
          }
          let typed = value as T;
          if (typed === "true") typed = true as T;
          if (typed === "false") typed = false as T;
          this.setValue(typed);
        });
      }

      this.elements = Array.from(els);
    } else if (this.mode === "range") {
      const el = document.querySelector(
        `.pageSettings .section[data-config-name=${this.configName}] input[type=range]`
      );

      if (el === null) {
        throw new Error(`Failed to find range element for ${configName}`);
      }

      const debounced = debounce<(val: T) => void>(250, (val) => {
        this.setValue(val);
      });

      el.addEventListener("input", (e) => {
        if (
          el.classList.contains("disabled") ||
          el.classList.contains("no-auto-handle")
        ) {
          return;
        }
        const val = parseFloat((el as HTMLInputElement).value) as unknown as T;
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

  setValue(value: T): void {
    if (Config[this.configName as keyof typeof Config] === value) {
      return;
    }
    this.configFunction(value);
    this.updateUI();
    if (this.setCallback) this.setCallback();
  }

  updateUI(valueOverride?: T): void {
    const newValue =
      valueOverride ?? (Config[this.configName as keyof typeof Config] as T);

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
          button.classList.remove("active");
        } else {
          button.classList.add("active");
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
