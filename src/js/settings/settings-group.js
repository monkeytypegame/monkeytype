import Config from "./config";

export default class SettingsGroup {
  constructor(
    configName,
    toggleFunction,
    setCallback = null,
    updateCallback = null
  ) {
    this.configName = configName;
    this.configValue = Config[configName];
    this.onOff = typeof this.configValue === "boolean";
    this.toggleFunction = toggleFunction;
    this.setCallback = setCallback;
    this.updateCallback = updateCallback;

    this.updateButton();

    $(document).on(
      "click",
      `.pageSettings .section.${this.configName} .button`,
      (e) => {
        let target = $(e.currentTarget);
        if (target.hasClass("disabled") || target.hasClass("no-auto-handle"))
          return;
        if (this.onOff) {
          if (target.hasClass("on")) {
            this.setValue(true);
          } else {
            this.setValue(false);
          }
          this.updateButton();
          if (this.setCallback !== null) this.setCallback();
        } else {
          const value = target.attr(configName);
          const params = target.attr("params");
          if (!value && !params) return;
          this.setValue(value, params);
        }
      }
    );
  }

  setValue(value, params = undefined) {
    if (params === undefined) {
      this.toggleFunction(value);
    } else {
      this.toggleFunction(value, ...params);
    }
    this.updateButton();
    if (this.setCallback !== null) this.setCallback();
  }

  updateButton() {
    this.configValue = Config[this.configName];
    $(`.pageSettings .section.${this.configName} .button`).removeClass(
      "active"
    );
    if (this.onOff) {
      const onOffString = this.configValue ? "on" : "off";
      $(
        `.pageSettings .section.${this.configName} .buttons .button.${onOffString}`
      ).addClass("active");
    } else {
      $(
        `.pageSettings .section.${this.configName} .button[${this.configName}='${this.configValue}']`
      ).addClass("active");
    }
    if (this.updateCallback !== null) this.updateCallback();
  }
}
