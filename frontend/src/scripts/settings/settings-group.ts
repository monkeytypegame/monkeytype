import Config from "../config";

export default class SettingsGroup {
  public configName: string;
  public configValue: any;
  public configFunction: (value: any, params?: any[]) => any;
  public mode: string;
  public setCallback?: () => any;
  public updateCallback?: () => any;
  constructor(
    configName: string,
    configFunction: (...values: any[]) => any,
    mode: string,
    setCallback?: () => any,
    updateCallback?: () => any
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
          if (target.hasClass("disabled") || target.hasClass("no-auto-handle"))
            return;
          this.setValue(target.val());
        }
      );
    } else if (this.mode === "button") {
      $(document).on(
        "click",
        `.pageSettings .section.${this.configName} .button`,
        (e) => {
          const target = $(e.currentTarget);
          if (target.hasClass("disabled") || target.hasClass("no-auto-handle"))
            return;
          let value: string | boolean = target.attr(configName) as string;
          const params = target.attr("params");
          if (!value && !params) return;
          if (value === "true") value = true;
          if (value === "false") value = false;
          this.setValue(value, params as any);
        }
      );
    }
  }

  setValue(value: any, params?: any[]): void {
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
        .val(this.configValue)
        .trigger("change.select2");
    } else if (this.mode === "button") {
      $(
        `.pageSettings .section.${this.configName} .button[${this.configName}='${this.configValue}']`
      ).addClass("active");
    }
    if (this.updateCallback) this.updateCallback();
  }
}
