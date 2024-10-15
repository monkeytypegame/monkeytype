import * as FunboxList from "./funbox-list";
import * as Notifications from "../../elements/notifications";
import * as Strings from "../../utils/strings";
import { Config, ConfigValue } from "@monkeytype/contracts/schemas/configs";
import { intersect } from "@monkeytype/util/arrays";
import { FunboxForcedConfig, FunboxMetadata } from "../../utils/json-data";

export function checkFunboxForcedConfigs(
  key: string,
  value: ConfigValue,
  funbox: string
): {
  result: boolean;
  forcedConfigs?: ConfigValue[];
} {
  if (FunboxList.get(funbox).length === 0) return { result: true };

  if (key === "words" || key === "time") {
    if (value === 0) {
      if (funbox === "nospace") {
        console.log("break");
      }
      const fb = FunboxList.get(funbox).filter((f) =>
        f.properties?.includes("noInfiniteDuration")
      );
      if (fb.length > 0) {
        return {
          result: false,
          forcedConfigs: [key === "words" ? 10 : 15],
        };
      } else {
        return { result: true };
      }
    } else {
      return { result: true };
    }
  } else {
    const forcedConfigs: Record<string, ConfigValue[]> = {};
    // collect all forced configs
    for (const fb of FunboxList.get(funbox)) {
      if (fb.forcedConfig) {
        //push keys to forcedConfigs, if they don't exist. if they do, intersect the values
        for (const key in fb.forcedConfig) {
          if (forcedConfigs[key] === undefined) {
            forcedConfigs[key] = fb.forcedConfig[key] as ConfigValue[];
          } else {
            forcedConfigs[key] = intersect(
              forcedConfigs[key],
              fb.forcedConfig[key] as ConfigValue[],
              true
            );
          }
        }
      }
    }

    //check if the key is in forcedConfigs, if it is check the value, if its not, return true
    if (forcedConfigs[key] === undefined) {
      return { result: true };
    } else {
      if (forcedConfigs[key]?.length === 0) {
        throw new Error("No intersection of forced configs");
      }
      return {
        result: (forcedConfigs[key] ?? []).includes(value),
        forcedConfigs: forcedConfigs[key],
      };
    }
  }
}

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
    let fb: FunboxMetadata[] = [];
    fb = fb.concat(
      FunboxList.get(funbox).filter(
        (f) =>
          f.forcedConfig?.["mode"] !== undefined &&
          !f.forcedConfig?.["mode"].includes(value)
      )
    );
    if (value === "zen") {
      fb = fb.concat(
        FunboxList.get(funbox).filter(
          (f) =>
            f.functions?.getWord ??
            f.functions?.pullSection ??
            f.functions?.alterText ??
            f.functions?.withWords ??
            f.properties?.includes("changesCapitalisation") ??
            f.properties?.includes("nospace") ??
            f.properties?.find((fp) => fp.startsWith("toPush:")) ??
            f.properties?.includes("changesWordsVisibility") ??
            f.properties?.includes("speaks") ??
            f.properties?.includes("changesLayout") ??
            f.properties?.includes("changesWordsFrequency")
        )
      );
    }
    if (value === "quote" || value === "custom") {
      fb = fb.concat(
        FunboxList.get(funbox).filter(
          (f) =>
            f.functions?.getWord ??
            f.functions?.pullSection ??
            f.functions?.withWords ??
            f.properties?.includes("changesWordsFrequency")
        )
      );
    }

    if (fb.length > 0) {
      errorCount += 1;
    }
  }
  if (key === "words" || key === "time") {
    if (!checkFunboxForcedConfigs(key, value, funbox).result) {
      if (!noNotification) {
        Notifications.add("Active funboxes do not support infinite tests", 0);
        return false;
      } else {
        errorCount += 1;
      }
    }
  } else if (!checkFunboxForcedConfigs(key, value, funbox).result) {
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

export function areFunboxesCompatible(
  funboxes: string,
  withFunbox?: string
): boolean {
  if (withFunbox === "none" || funboxes === "none") return true;
  let funboxesToCheck = FunboxList.get(funboxes);
  if (withFunbox !== undefined) {
    funboxesToCheck = funboxesToCheck.concat(
      FunboxList.getAll().filter((f) => f.name === withFunbox)
    );
  }

  const allFunboxesAreValid =
    FunboxList.get(funboxes).filter(
      (f) => funboxes.split("#").find((cf) => cf === f.name) !== undefined
    ).length === funboxes.split("#").length;
  const oneWordModifierMax =
    funboxesToCheck.filter(
      (f) =>
        f.functions?.getWord ??
        f.functions?.pullSection ??
        f.functions?.withWords
    ).length <= 1;
  const layoutUsability =
    funboxesToCheck.filter((f) =>
      f.properties?.find((fp) => fp === "changesLayout")
    ).length === 0 ||
    funboxesToCheck.filter((f) =>
      f.properties?.find((fp) => fp === "ignoresLayout" || fp === "usesLayout")
    ).length === 0;
  const oneNospaceOrToPushMax =
    funboxesToCheck.filter((f) =>
      f.properties?.find((fp) => fp === "nospace" || fp.startsWith("toPush"))
    ).length <= 1;
  const oneChangesWordsVisibilityMax =
    funboxesToCheck.filter((f) =>
      f.properties?.find((fp) => fp === "changesWordsVisibility")
    ).length <= 1;
  const oneFrequencyChangesMax =
    funboxesToCheck.filter((f) =>
      f.properties?.find((fp) => fp === "changesWordsFrequency")
    ).length <= 1;
  const noFrequencyChangesConflicts =
    funboxesToCheck.filter((f) =>
      f.properties?.find((fp) => fp === "changesWordsFrequency")
    ).length === 0 ||
    funboxesToCheck.filter((f) =>
      f.properties?.find((fp) => fp === "ignoresLanguage")
    ).length === 0;
  const capitalisationChangePosibility =
    funboxesToCheck.filter((f) =>
      f.properties?.find((fp) => fp === "noLetters")
    ).length === 0 ||
    funboxesToCheck.filter((f) =>
      f.properties?.find((fp) => fp === "changesCapitalisation")
    ).length === 0;
  const noConflictsWithSymmetricChars =
    funboxesToCheck.filter((f) =>
      f.properties?.find((fp) => fp === "conflictsWithSymmetricChars")
    ).length === 0 ||
    funboxesToCheck.filter((f) =>
      f.properties?.find((fp) => fp === "symmetricChars")
    ).length === 0;
  const oneCanSpeakMax =
    funboxesToCheck.filter((f) => f.properties?.find((fp) => fp === "speaks"))
      .length <= 1;
  const hasLanguageToSpeakAndNoUnspeakable =
    funboxesToCheck.filter((f) => f.properties?.find((fp) => fp === "speaks"))
      .length === 0 ||
    (funboxesToCheck.filter((f) => f.properties?.find((fp) => fp === "speaks"))
      .length === 1 &&
      funboxesToCheck.filter((f) =>
        f.properties?.find((fp) => fp === "unspeakable")
      ).length === 0) ||
    funboxesToCheck.filter((f) =>
      f.properties?.find((fp) => fp === "ignoresLanguage")
    ).length === 0;
  const oneToPushOrPullSectionMax =
    funboxesToCheck.filter(
      (f) =>
        (f.properties?.find((fp) => fp.startsWith("toPush:")) ?? "") ||
        f.functions?.pullSection
    ).length <= 1;
  const oneApplyCSSMax =
    funboxesToCheck.filter((f) => f.hasCSS == true).length <= 1;
  const onePunctuateWordMax =
    funboxesToCheck.filter((f) => f.functions?.punctuateWord).length <= 1;
  const oneCharCheckerMax =
    funboxesToCheck.filter((f) => f.functions?.isCharCorrect).length <= 1;
  const oneCharReplacerMax =
    funboxesToCheck.filter((f) => f.functions?.getWordHtml).length <= 1;
  const oneChangesCapitalisationMax =
    funboxesToCheck.filter((f) =>
      f.properties?.find((fp) => fp === "changesCapitalisation")
    ).length <= 1;
  const allowedConfig = {} as FunboxForcedConfig;
  let noConfigConflicts = true;
  for (const f of funboxesToCheck) {
    if (!f.forcedConfig) continue;
    for (const key in f.forcedConfig) {
      if (allowedConfig[key]) {
        if (
          intersect(
            allowedConfig[key],
            f.forcedConfig[key] as ConfigValue[],
            true
          ).length === 0
        ) {
          noConfigConflicts = false;
          break;
        }
      } else {
        allowedConfig[key] = f.forcedConfig[key] as ConfigValue[];
      }
    }
  }

  return (
    allFunboxesAreValid &&
    oneWordModifierMax &&
    layoutUsability &&
    oneNospaceOrToPushMax &&
    oneChangesWordsVisibilityMax &&
    oneFrequencyChangesMax &&
    noFrequencyChangesConflicts &&
    capitalisationChangePosibility &&
    noConflictsWithSymmetricChars &&
    oneCanSpeakMax &&
    hasLanguageToSpeakAndNoUnspeakable &&
    oneToPushOrPullSectionMax &&
    oneApplyCSSMax &&
    onePunctuateWordMax &&
    oneCharCheckerMax &&
    oneCharReplacerMax &&
    oneChangesCapitalisationMax &&
    noConfigConflicts
  );
}
