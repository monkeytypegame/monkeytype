import Config from "../config";

export default class SettingsGroup<T> {
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

    this.updateInput();

    if (this.mode === "select") {
      $(".pageSettings").on(
        "change",
        `.section.${this.configName} select`,
        (e) => {
          const target = $(e.currentTarget);
          if (
            target.hasClass("disabled") ||
            target.hasClass("no-auto-handle")
          ) {
            return;
          }
          this.setValue(target.val() as T);
        }
      );
    } else if (this.mode === "button") {
      $(".pageSettings").on(
        "click",
        `.section.${this.configName} .button`,
        (e) => {
          const target = $(e.currentTarget);
          if (
            target.hasClass("disabled") ||
            target.hasClass("no-auto-handle")
          ) {
            return;
          }
          let value: string | boolean = target.attr(configName) as string;
          if (!value) return;
          if (value === "true") value = true;
          if (value === "false") value = false;
          this.setValue(value as T);
        }
      );
    }
  }

  setValue(value: T): void {
    this.configFunction(value);
    this.updateInput();
    if (this.setCallback) this.setCallback();
  }

  updateInput(): void {
    this.configValue = Config[this.configName as keyof typeof Config] as T;
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
