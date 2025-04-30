import { ConfigValue } from "@monkeytype/contracts/schemas/configs";
import Config from "../../config";
import * as Notifications from "../notifications";
import SlimSelect from "slim-select";
import { debounce } from "throttle-debounce";

type Mode = "select" | "button" | "range";

export default class SettingsGroup<T extends ConfigValue> {
  public configName: string;
  public configValue: T;
  public configFunction: (param: T, nosave?: boolean) => boolean;
  public mode: Mode;
  public setCallback?: () => void;
  public updateCallback?: () => void;
  private element?: Element | null;

  constructor(
    configName: string,
    configFunction: (param: T, nosave?: boolean) => boolean,
    mode: Mode,
    setCallback?: () => void,
    updateCallback?: () => void
  ) {
    this.configName = configName;
    this.configValue = Config[configName as keyof typeof Config] as T;
    this.mode = mode;
    this.configFunction = configFunction;
    this.setCallback = setCallback;
    this.updateCallback = updateCallback;

    this.updateUI();

    if (this.mode === "select") {
      this.element = document.querySelector(
        `.pageSettings .section[data-config-name=${this.configName}] select`
      );

      if (this.element?.hasAttribute("multiple")) {
        throw new Error(
          "multi-select dropdowns not supported. Config: " + this.configName
        );
      }

      //@ts-expect-error this is fine, slimselect adds slim to the element
      const ss = this.element?.slim as SlimSelect | undefined;

      if (ss !== undefined) {
        ss.render.callbacks.afterChange = (newval) => {
          this.setValue(newval[0]?.value as T);
        };
      } else {
        this.element?.addEventListener("change", (e) => {
          const target = $(e.target as HTMLSelectElement);
          if (
            target.hasClass("disabled") ||
            target.hasClass("no-auto-handle")
          ) {
            return;
          }

          this.setValue(target.val() as T);
        });
      }
    } else if (this.mode === "button") {
      $(".pageSettings").on(
        "click",
        `.section[data-config-name='${this.configName}'] button`,
        (e) => {
          const target = $(e.currentTarget);
          if (
            target.hasClass("disabled") ||
            target.hasClass("no-auto-handle")
          ) {
            return;
          }
          const value = target.attr(`data-config-value`);
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
        }
      );
    } else if (this.mode === "range") {
      this.element = document.querySelector(
        `.pageSettings .section[data-config-name=${this.configName}] input[type=range]`
      );

      if (!this.element) {
        Notifications.add(`Failed to find range element for ${configName}`, -1);
        return;
      }

      const debounced = debounce<(val: T) => void>(250, (val) => {
        this.setValue(val);
      });

      this.element.addEventListener("input", (e) => {
        const target = $(e.target as HTMLInputElement);
        if (target.hasClass("disabled") || target.hasClass("no-auto-handle")) {
          return;
        }
        const val = parseFloat(target.val() as string) as unknown as T;

        this.updateUI(val);
        debounced(val);
      });
    }
  }

  setValue(value: T): void {
    if (this.configValue === value) return;

    this.configFunction(value);
    this.updateUI();
    if (this.setCallback) this.setCallback();
  }

  updateUI(valueOverride?: T): void {
    const start = performance.now();
    const newValue =
      valueOverride ?? (Config[this.configName as keyof typeof Config] as T);
    $(
      `.pageSettings .section[data-config-name='${this.configName}'] button`
    ).removeClass("active");
    if (this.mode === "select") {
      const select = this.element as HTMLSelectElement | null;
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
      $(
        // this cant be an object?
        // eslint-disable-next-line @typescript-eslint/no-base-to-string
        `.pageSettings .section[data-config-name='${this.configName}'] button[data-config-value='${newValue}']`
      ).addClass("active");
    } else if (this.mode === "range") {
      const range = this.element as HTMLInputElement | null | undefined;

      const rangeValue = document.querySelector(
        `.pageSettings .section[data-config-name='${this.configName}'] .value`
      );

      if (range === undefined || range === null || rangeValue === null) {
        return;
      }

      range.value = newValue as unknown as string;
      rangeValue.textContent = `${(newValue as number).toFixed(1)}`;
    }
    const time = performance.now() - start;
    if (time > 4) {
      if (this.updateCallback) this.updateCallback();
      console.log("### updateUI ", {
        config: this.configName,
        mode: this.mode,
        time: time.toFixed(2) + "ms",
      });
    }
  }
}
