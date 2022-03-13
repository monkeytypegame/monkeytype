import Config from "../config";

type ConfigValues =
  | string
  | number
  | boolean
  | string[]
  | MonkeyTypes.QuoteLength[]
  | MonkeyTypes.ResultFilters
  | MonkeyTypes.CustomBackgroundFilter
  | null
  | undefined;

export default class SettingsGroup {
  public configName: string;
  public configValue: ConfigValues;
  public configFunction: (...params: any[]) => boolean;
  public mode: string;
  public setCallback?: () => void;
  public updateCallback?: () => void;
  constructor(
    configName: string,
    configFunction: (...params: any[]) => boolean,
    mode: string,
    setCallback?: () => void,
    updateCallback?: () => void
  ) {
    this.configName = configName;
    this.configValue = Config[configName as keyof typeof Config];
    this.mode = mode;
    this.configFunction = configFunction;
    this.setCallback = setCallback;
    this.updateCallback = updateCallback;

    this.updateInput();

    if (this.mode === "select") {
      $(document).on(
        "change",
        `.pageSettings .section.${this.configName} select`,
        (e) => {
          const target = $(e.currentTarget);
          if (
            target.hasClass("disabled") ||
            target.hasClass("no-auto-handle")
          ) {
            return;
          }
          this.setValue(target.val());
        }
      );
    } else if (this.mode === "button") {
      $(document).on(
        "click",
        `.pageSettings .section.${this.configName} .button`,
        (e) => {
          const target = $(e.currentTarget);
          if (
            target.hasClass("disabled") ||
            target.hasClass("no-auto-handle")
          ) {
            return;
          }
          let value: string | boolean = target.attr(configName) as string;
          const params = target.attr("params");
          if (!value && !params) return;
          if (value === "true") value = true;
          if (value === "false") value = false;
          this.setValue(value, params as unknown as ConfigValues[]);
        }
      );
    }
  }

  setValue(value: ConfigValues, params?: ConfigValues[]): void {
    if (params === undefined) {
      this.configFunction(value);
    } else {
      this.configFunction(value, ...params);
    }
    this.updateInput();
    if (this.setCallback) this.setCallback();
  }

  updateInput(): void {
    this.configValue = Config[this.configName as keyof typeof Config];
    $(`.pageSettings .section.${this.configName} .button`).removeClass(
      "active"
    );
    if (this.mode === "select") {
      $(`.pageSettings .section.${this.configName} select`)
        .val(this.configValue as string)
        .trigger("change.select2");
    } else if (this.mode === "button") {
      $(
        `.pageSettings .section.${this.configName} .button[${this.configName}='${this.configValue}']`
      ).addClass("active");
    }
    if (this.updateCallback) this.updateCallback();
  }
}
