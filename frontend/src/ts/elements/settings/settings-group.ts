import { ConfigValue } from "@monkeytype/contracts/schemas/configs";
import Config from "../../config";
import * as Notifications from "../notifications";
// @ts-expect-error TODO: update slim-select
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
      const selectElement = document.querySelector(
        `.pageSettings .section[data-config-name=${this.configName}] select`
      );
      selectElement?.addEventListener("change", (e) => {
        const target = $(e.target as HTMLSelectElement);
        if (target.hasClass("disabled") || target.hasClass("no-auto-handle")) {
          return;
        }
        this.setValue(target.val() as T);
      });
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
      const rangeElement = document.querySelector(
        `.pageSettings .section[data-config-name=${this.configName}] input[type=range]`
      );

      if (!rangeElement) {
        Notifications.add(`Failed to find range element for ${configName}`, -1);
        return;
      }

      const debounced = debounce<(val: T) => void>(250, (val) => {
        this.setValue(val);
      });

      rangeElement.addEventListener("input", (e) => {
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
    this.configFunction(value);
    this.updateUI();
    if (this.setCallback) this.setCallback();
  }

  updateUI(valueOverride?: T): void {
    this.configValue =
      valueOverride ?? (Config[this.configName as keyof typeof Config] as T);
    $(
      `.pageSettings .section[data-config-name='${this.configName}'] button`
    ).removeClass("active");
    if (this.mode === "select") {
      const select = document.querySelector<HTMLSelectElement>(
        `.pageSettings .section[data-config-name='${this.configName}'] select`
      );

      if (select === null) {
        return;
      }

      select.value = this.configValue as string;

      //@ts-expect-error
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
      const ss = select.slim as SlimSelect | undefined;
      ss?.store.setSelectedBy("value", [this.configValue as string]);
      ss?.render.renderValues();
      ss?.render.renderOptions(ss.store.getData());
    } else if (this.mode === "button") {
      $(
        // this cant be an object?
        // eslint-disable-next-line @typescript-eslint/no-base-to-string
        `.pageSettings .section[data-config-name='${this.configName}'] button[data-config-value='${this.configValue}']`
      ).addClass("active");
    } else if (this.mode === "range") {
      const range = document.querySelector<HTMLInputElement>(
        `.pageSettings .section[data-config-name='${this.configName}'] input[type=range]`
      );
      const rangeValue = document.querySelector(
        `.pageSettings .section[data-config-name='${this.configName}'] .value`
      );

      if (range === null || rangeValue === null) {
        return;
      }

      range.value = this.configValue as unknown as string;
      rangeValue.textContent = `${(this.configValue as number).toFixed(1)}`;
    }
    if (this.updateCallback) this.updateCallback();
  }
}
