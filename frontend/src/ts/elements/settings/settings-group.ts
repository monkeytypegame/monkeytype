import Config from "../../config";
import * as Notifications from "../notifications";
import SlimSelect from "slim-select";

export default class SettingsGroup<T extends SharedTypes.ConfigValue> {
  public configName: string;
  public configValue: T;
  public configFunction: (param: T, nosave?: boolean) => boolean;
  public mode: string;
  public setCallback?: () => void;
  public updateCallback?: () => void;
  constructor(
    configName: string,
    configFunction: (param: T, nosave?: boolean) => boolean,
    mode: string,
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
          this.setValue(typed as T);
        }
      );
    }
  }

  setValue(value: T): void {
    this.configFunction(value);
    this.updateUI();
    if (this.setCallback) this.setCallback();
  }

  updateUI(): void {
    this.configValue = Config[this.configName as keyof typeof Config] as T;
    $(
      `.pageSettings .section[data-config-name='${this.configName}'] button`
    ).removeClass("active");
    if (this.mode === "select") {
      const select = document.querySelector(
        `.pageSettings .section[data-config-name='${this.configName}'] select`
      ) as HTMLSelectElement | null;

      if (select === null) {
        return;
      }

      select.value = this.configValue as string;

      //@ts-expect-error
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
    }
    if (this.updateCallback) this.updateCallback();
  }
}
