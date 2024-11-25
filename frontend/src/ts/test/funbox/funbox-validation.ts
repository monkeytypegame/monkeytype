import * as Funbox from "./funbox";
import * as Notifications from "../../elements/notifications";
import * as Strings from "../../utils/strings";
import { Config, ConfigValue } from "@monkeytype/contracts/schemas/configs";

// function: canSetConfigWithCurrentFunboxes
// checks using checkFunboxForcedConfigs. if it returns true, return true
// if it returns false, show a notification and return false
export function canSetConfigWithCurrentFunboxes(
  key: string,
  value: ConfigValue,
  funbox: string,
  noNotification = false
): boolean {
  let errorCount = 0;
  if (key === "mode") {
    let fb = Funbox.getFromString(funbox).filter(
      (f) =>
        f.frontendForcedConfig?.["mode"] !== undefined &&
        !(f.frontendForcedConfig["mode"] as ConfigValue[]).includes(value)
    );
    if (value === "zen") {
      fb = fb.concat(
        Funbox.getFromString(funbox).filter((f) => {
          return (
            f.frontendFunctions?.includes("getWord") ??
            f.frontendFunctions?.includes("pullSection") ??
            f.frontendFunctions?.includes("alterText") ??
            f.frontendFunctions?.includes("withWords") ??
            f.properties?.includes("changesCapitalisation") ??
            f.properties?.includes("nospace") ??
            f.properties?.find((fp) => fp.startsWith("toPush:")) ??
            f.properties?.includes("changesWordsVisibility") ??
            f.properties?.includes("speaks") ??
            f.properties?.includes("changesLayout") ??
            f.properties?.includes("changesWordsFrequency")
          );
        })
      );
    }
    if (value === "quote" || value === "custom") {
      fb = fb.concat(
        Funbox.getFromString(funbox).filter((f) => {
          return (
            f.frontendFunctions?.includes("getWord") ??
            f.frontendFunctions?.includes("pullSection") ??
            f.frontendFunctions?.includes("withWords") ??
            f.properties?.includes("changesWordsFrequency")
          );
        })
      );
    }

    if (fb.length > 0) {
      errorCount += 1;
    }
  }
  if (key === "words" || key === "time") {
    if (
      !Funbox.checkFunboxForcedConfigs(key, value, Funbox.getFromString(funbox))
        .result
    ) {
      if (!noNotification) {
        Notifications.add("Active funboxes do not support infinite tests", 0);
        return false;
      } else {
        errorCount += 1;
      }
    }
  } else if (
    !Funbox.checkFunboxForcedConfigs(key, value, Funbox.getFromString(funbox))
      .result
  ) {
    errorCount += 1;
  }

  if (errorCount > 0) {
    if (!noNotification) {
      Notifications.add(
        `You can't set ${Strings.camelCaseToWords(
          key
        )} to ${value.toString()} with currently active funboxes.`,
        0,
        {
          duration: 5,
        }
      );
    }
    return false;
  } else {
    return true;
  }
}

export function canSetFunboxWithConfig(
  funbox: string,
  config: Config
): boolean {
  console.log("cansetfunboxwithconfig", funbox, config.mode);
  let funboxToCheck = config.funbox;
  if (funboxToCheck === "none") {
    funboxToCheck = funbox;
  } else {
    funboxToCheck += "#" + funbox;
  }
  const errors = [];
  for (const [configKey, configValue] of Object.entries(config)) {
    if (
      !canSetConfigWithCurrentFunboxes(
        configKey,
        configValue,
        funboxToCheck,
        true
      )
    ) {
      errors.push({
        key: configKey,
        value: configValue,
      });
    }
  }
  if (errors.length > 0) {
    const errorStrings = [];
    for (const error of errors) {
      errorStrings.push(
        `${Strings.capitalizeFirstLetter(
          Strings.camelCaseToWords(error.key)
        )} cannot be set to ${error.value.toString()}.`
      );
    }
    Notifications.add(
      `You can't enable ${funbox.replace(/_/g, " ")}:<br>${errorStrings.join(
        "<br>"
      )}`,
      0,
      {
        duration: 5,
        allowHTML: true,
      }
    );
    return false;
  } else {
    return true;
  }
}
