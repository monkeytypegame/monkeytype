import * as UpdateConfig from "./config";
import * as Notifications from "./notifications";
import * as Commands from "./commandline-lists";
import * as CustomText from "./custom-text";
import * as GlobalSettings from "./settings";

// === Setting classes ===
// the callback is used in `set()` method to set value in config
// to set a value use the `set()` method
// if input is valid `set()` method will call callback and return true, otherwise it will retrun false

// Setting with multiple text options
// allows only one option as input
// `command` is used to get setting options
class OptionsSetting {
  constructor(callback, command, byDisplay = false) {
    this.callback = callback;
    this.options = {};
    if (byDisplay) {
      command.list.forEach((option) => {
        this.options[option.display.toLowerCase()] = option.configValue;
      });
    } else {
      if (Array.isArray(command))
        command.forEach((option) => {
          this.options[option] = option;
        });
      else
        command.list.forEach((option) => {
          this.options[option.configValue] = option.configValue;
        });
    }
  }

  set(val) {
    val = val.toLowerCase(); // This might cause problems with settings that don't have lower-case config values - should revisit this later
    if (this.validate(val)) {
      this.callback(val);
      return true;
    }
    return false;
  }

  validate(val) {
    return Object.keys(this.options).includes(val.toLowerCase());
  }
}

class NumberSetting {
  constructor(callback, min = undefined, max = undefined) {
    this.callback = callback;
    this.min = min;
    this.max = max;
  }

  set(val) {
    let num = parseInt(val);
    if (this.validate(num) && this.check(num)) {
      this.callback(num);
      return true;
    }
    return false;
  }

  check(num) {
    return (
      (this.min < num || this.min === undefined) &&
      (this.max > num || this.max === undefined)
    );
  }

  validate(num) {
    return !Number.isNaN(num);
  }
}

class BoolSetting {
  constructor(callback) {
    this.callback = callback;
    this.options = ["true", "on", "", "false", "off"];
  }

  set(val) {
    val = val.toLowerCase();
    if (val === "true" || val === "on" || val === "") {
      this.callback(true);
      return true;
    } else if (val === "false" || val === "off") {
      this.callback(false);
      return true;
    }
    return false;
  }
}

class TextSetting {
  constructor(callback) {
    this.callback = callback;
  }

  set(val) {
    this.callback(val);
    return true;
  }
}

class OffOrNumberSetting {
  constructor(callback1, callback2, min = undefined, max = undefined) {
    this.callback1 = callback1;
    this.callback2 = callback2;
    this.min = min;
    this.max = max;
  }

  set(val) {
    if (["off", "false"].includes(val)) {
      this.callback1(val);
      return true;
    }
    let num = parseInt(val);
    if (this.validate(num) && this.check(num)) {
      this.callback1("custom");
      this.callback2(num);
      return true;
    }
    return false;
  }

  check(num) {
    return (
      (this.min < num || this.min === undefined) &&
      (this.max > num || this.max === undefined)
    );
  }

  validate(num) {
    return !Number.isNaN(num);
  }
}

class CustomBackgroundFilterSetting {
  constructor(callback, sep = ",") {
    this.callback = callback;
    this.sep = sep;
    // min,max values for each of the settings
    // order is important!
    this.values = {
      0: [0.0, 5.0], // Blur
      1: [0.0, 2.0], // Brightness
      2: [0.0, 2.0], // Saturation
      3: [0.0, 1.0], // Opacity
    };
  }

  set(val) {
    let arr = val.split(this.sep);
    // input array is incomplete
    if (arr.lenght !== this.values.lenght) return false;

    let converted = []; // values converted from string to float
    arr.forEach((num, i) => {
      let parsed = parseFloat(num);
      if (this.validate(parsed, i) && this.check(parsed, i))
        converted.push(parsed);
      else return false;
    });
    this.callback(converted);
    return true;
  }

  check(num, i) {
    return this.values[i][0] < num < this.values[i][1];
  }

  validate(num) {
    return !Number.isNaN(num);
  }
}

// List of all settings that a user should be able to set from URL
// might be interesting to add aliases
// settings that don't work yet: quoteLength, theme, customTheme, tags
let Settings = {
  punctuation: new BoolSetting(UpdateConfig.setPunctuation),
  mode: new OptionsSetting(UpdateConfig.setMode, Commands.commandsMode),
  time: new NumberSetting(UpdateConfig.setTimeConfig),
  words: new NumberSetting(UpdateConfig.setWordCount),
  numbers: new BoolSetting(UpdateConfig.setNumbers),
  quoteLength: new OptionsSetting(
    UpdateConfig.setQuoteLength,
    Commands.commandsQuoteLengthConfig,
    true
  ),
  confidenceMode: new OptionsSetting(
    UpdateConfig.setConfidenceMode,
    Commands.commandsConfidenceMode
  ),
  stopOnError: new OptionsSetting(
    UpdateConfig.setStopOnError,
    Commands.commandsStopOnError
  ),
  repeateQuote: new OptionsSetting(
    UpdateConfig.setRepeatQuotes,
    Commands.commandsRepeatQuotes
  ),
  freedomMode: new BoolSetting(UpdateConfig.setFreedomMode),
  strictSpace: new BoolSetting(UpdateConfig.setStrictSpace),
  blindMode: new BoolSetting(UpdateConfig.setBlindMode),
  singleListCommandLine: new OptionsSetting(
    UpdateConfig.setSingleListCommandLine,
    Commands.commandsSingleListCommandLine
  ),
  minWpm: new OffOrNumberSetting(
    UpdateConfig.setMinWpm,
    UpdateConfig.setMinWpmCustomSpeed
  ),
  minAcc: new OffOrNumberSetting(
    UpdateConfig.setMinAcc,
    UpdateConfig.setMinAccCustom
  ),
  minBurst: new OffOrNumberSetting(
    UpdateConfig.setMinBurst,
    UpdateConfig.setMinBurstCustomSpeed
  ),
  lazyMode: new BoolSetting(UpdateConfig.setLazyMode),
  highlightMode: new OptionsSetting(
    UpdateConfig.setHighlightMode,
    Commands.commandsHighlightMode
  ),
  language: new OptionsSetting(
    UpdateConfig.setLanguage,
    Commands.commandsLanguages
  ),
  funbox: new OptionsSetting(UpdateConfig.setFunbox, Commands.commandsFunbox),
  layout: new OptionsSetting(UpdateConfig.setLayout, Commands.commandsLayouts),
  custom: new TextSetting(function (val) {
    val = val.split("|");
    CustomText.setText(val);
    CustomText.setWord(val.length);
  }),
  // maybe merge theme and customTheme into one?
  theme: new OptionsSetting(function (theme) {
    UpdateConfig.setTheme(theme);
    UpdateConfig.setCustomTheme(false);
  }, Commands.themeCommands),
  // possibly create custom setting to return validation status
  customTheme: new TextSetting(function (val) {
    val = val.split(",");
    if (val.lenght === 9) {
      UpdateConfig.setCustomThemeColors(val);
      UpdateConfig.setCustomTheme(true);
      GlobalSettings.setCustomThemeInputs();
    }
  }),
  randomTheme: new OptionsSetting(
    UpdateConfig.setRandomTheme,
    Commands.commandsRandomTheme
  ),
  difficulty: new OptionsSetting(UpdateConfig.setDifficulty, [
    "normal",
    "expert",
    "master",
  ]),
  customBackground: new TextSetting(UpdateConfig.setCustomBackground, null),
  customBackgroundFilter: new CustomBackgroundFilterSetting(
    UpdateConfig.setCustomBackgroundFilter
  ),
  customBackgroundSize: new OptionsSetting(
    UpdateConfig.setCustomBackgroundSize,
    ["cover", "containt", "max"]
  ),
};

export function loadFromUrl() {
  let url = new URL(window.location.href);

  // Parse URL params - set param keys to lower case
  let splitSettings = decodeURI(url.search).split("&");
  let availableSettings = splitSettings.length;
  let urlSettings = [];
  splitSettings.forEach((val) => {
    let set = val.split("=");
    set[0] = set[0].toLowerCase();
    urlSettings.push(set.join("="));
  });
  url.search = urlSettings.join("&");

  window.history.replaceState(null, null, url); // update the URL with new params
  // ui.js:129 prevents params from being shown for longer time

  let appliedSettings = 0;
  // Search for and apply settings
  Object.keys(Settings).forEach((name) => {
    let val = url.searchParams.get(name.toLowerCase()); // value of parameter
    if (val !== null) {
      let res = Settings[name].set(val);
      if (res) appliedSettings += 1;
      else
        Notifications.add(
          `Value for setting "${name}" is not valid`,
          -1,
          undefined,
          "Settings from URL"
        );
    }
  });

  // Notify user about applied settings (if none, don't notify)
  if (appliedSettings > 0) {
    let quantity = "Some";
    if (availableSettings === appliedSettings) quantity = "All";
    Notifications.add(
      `${quantity} settings applied`,
      1,
      undefined,
      "Settings from URL"
    );
  }
}
