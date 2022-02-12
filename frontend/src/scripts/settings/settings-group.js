import Config from "../config";

export default class SettingsGroup {
  constructor(
    configName,
    configFunction,
    mode,
    setCallback = null,
    updateCallback = null
  ) {
    this.configName = configName;
    this.configValue = Config[configName];
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
          let target = $(e.currentTarget);
          if (target.hasClass("disabled") || target.hasClass("no-auto-handle"))
            return;
          let value = target.attr(configName);
          const params = target.attr("params");
          if (!value && !params) return;
          if (value === "true") value = true;
          if (value === "false") value = false;
          this.setValue(value, params);
        }
      );
    }
  }

  setValue(value, params = undefined) {
    if (params === undefined) {
      this.configFunction(value);
    } else {
      this.configFunction(value, ...params);
    }
    this.updateInput();
    if (this.setCallback !== null) this.setCallback();
  }

  updateInput() {
    this.configValue = Config[this.configName];
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
    if (this.updateCallback !== null) this.updateCallback();
  }
}
