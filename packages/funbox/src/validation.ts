import { intersect } from "@monkeytype/util/arrays";
import { FunboxForcedConfig, FunboxMetadata } from "./types";
import { getFunbox } from "./list";
import { ConfigValue, FunboxName } from "@monkeytype/schemas/configs";
import { safeNumber } from "@monkeytype/util/numbers";

export function checkForcedConfig(
  key: string,
  value: ConfigValue,
  funboxes: FunboxMetadata[],
): {
  result: boolean;
  forcedConfigs?: ConfigValue[];
} {
  if (funboxes.length === 0) {
    return { result: true };
  }

  if (key === "words" || key === "time") {
    if (value === 0) {
      const fb = funboxes.filter((f) =>
        f.properties?.includes("noInfiniteDuration"),
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
    for (const fb of funboxes) {
      if (fb.frontendForcedConfig) {
        //push keys to forcedConfigs, if they don't exist. if they do, intersect the values
        for (const forcedKey in fb.frontendForcedConfig) {
          if (forcedConfigs[forcedKey] === undefined) {
            forcedConfigs[forcedKey] = fb.frontendForcedConfig[
              forcedKey
            ] as ConfigValue[];
          } else {
            forcedConfigs[forcedKey] = intersect(
              forcedConfigs[forcedKey],
              fb.frontendForcedConfig[forcedKey] as ConfigValue[],
              true,
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

export function checkCompatibility(
  funboxNames: FunboxName[],
  withFunbox?: FunboxName,
): boolean {
  if (funboxNames.length === 0) return true;

  let funboxesToCheck: FunboxMetadata[];

  try {
    funboxesToCheck = getFunbox(funboxNames);

    if (withFunbox !== undefined) {
      const toAdd = getFunbox(withFunbox);
      funboxesToCheck = funboxesToCheck.concat(toAdd);
    }
  } catch (error) {
    console.error(
      "Error when getting funboxes for a compatibility check:",
      error,
    );
    return false;
  }

  const allFunboxesAreValid = funboxesToCheck.every((f) => f !== undefined);
  if (!allFunboxesAreValid) return false;

  const oneWordModifierMax =
    funboxesToCheck.filter(
      (f) =>
        f.frontendFunctions?.includes("getWord") === true ||
        f.frontendFunctions?.includes("pullSection") === true ||
        f.frontendFunctions?.includes("withWords") === true,
    ).length <= 1;
  const oneWordOrderMax =
    funboxesToCheck.filter(
      (f) =>
        f.properties?.find((fp) => fp.startsWith("wordOrder")) !== undefined,
    ).length <= 1;
  const layoutUsability =
    funboxesToCheck.filter((f) =>
      f.properties?.find((fp) => fp === "changesLayout"),
    ).length === 0 ||
    funboxesToCheck.filter((f) =>
      f.properties?.find((fp) => fp === "ignoresLayout" || fp === "usesLayout"),
    ).length === 0;
  const oneNospaceOrToPushMax =
    funboxesToCheck.filter(
      (f) =>
        f.properties?.find(
          (fp) => fp === "nospace" || fp.startsWith("toPush"),
        ) !== undefined,
    ).length <= 1;
  const oneChangesWordsVisibilityMax =
    funboxesToCheck.filter((f) =>
      f.properties?.find((fp) => fp === "changesWordsVisibility"),
    ).length <= 1;
  const oneFrequencyChangesMax =
    funboxesToCheck.filter((f) =>
      f.properties?.find((fp) => fp === "changesWordsFrequency"),
    ).length <= 1;
  const noFrequencyChangesConflicts =
    funboxesToCheck.filter((f) =>
      f.properties?.find((fp) => fp === "changesWordsFrequency"),
    ).length === 0 ||
    funboxesToCheck.filter((f) =>
      f.properties?.find((fp) => fp === "ignoresLanguage"),
    ).length === 0;
  const capitalisationChangePosibility =
    funboxesToCheck.filter((f) =>
      f.properties?.find((fp) => fp === "noLetters"),
    ).length === 0 ||
    funboxesToCheck.filter((f) =>
      f.properties?.find((fp) => fp === "changesCapitalisation"),
    ).length === 0;
  const noConflictsWithSymmetricChars =
    funboxesToCheck.filter((f) =>
      f.properties?.find((fp) => fp === "conflictsWithSymmetricChars"),
    ).length === 0 ||
    funboxesToCheck.filter((f) =>
      f.properties?.find((fp) => fp === "symmetricChars"),
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
        f.properties?.find((fp) => fp === "unspeakable"),
      ).length === 0) ||
    funboxesToCheck.filter((f) =>
      f.properties?.find((fp) => fp === "ignoresLanguage"),
    ).length === 0;
  const oneToPushOrPullSectionMax =
    funboxesToCheck.filter(
      (f) =>
        f.properties?.find((fp) => fp.startsWith("toPush:")) !== undefined ||
        f.frontendFunctions?.includes("pullSection"),
    ).length <= 1;
  const onePunctuateWordMax =
    funboxesToCheck.filter((f) =>
      f.frontendFunctions?.includes("punctuateWord"),
    ).length <= 1;
  const oneGetEmulatedCharMax =
    funboxesToCheck.filter((f) =>
      f.frontendFunctions?.includes("getEmulatedChar"),
    ).length <= 1;
  const oneCharCheckerMax =
    funboxesToCheck.filter((f) =>
      f.frontendFunctions?.includes("isCharCorrect"),
    ).length <= 1;
  const oneCharReplacerMax =
    funboxesToCheck.filter((f) => f.frontendFunctions?.includes("getWordHtml"))
      .length <= 1;
  const oneChangesCapitalisationMax =
    funboxesToCheck.filter((f) =>
      f.properties?.find((fp) => fp === "changesCapitalisation"),
    ).length <= 1;

  const oneCssModificationPerElement = Object.values(
    funboxesToCheck
      .map((f) => f.cssModifications)
      .filter((f) => f !== undefined)
      .flat()
      .reduce<Record<string, number>>((counts, cssModification) => {
        counts[cssModification] =
          (safeNumber(counts[cssModification]) ?? 0) + 1;
        return counts;
      }, {}),
  ).every((c) => c <= 1);

  const allowedConfig = {} as FunboxForcedConfig;
  let noConfigConflicts = true;
  for (const f of funboxesToCheck) {
    if (!f.frontendForcedConfig) continue;
    for (const key in f.frontendForcedConfig) {
      if (allowedConfig[key]) {
        if (
          intersect<string | boolean>(
            allowedConfig[key],
            f.frontendForcedConfig[key] as string[] | boolean[],
            true,
          ).length === 0
        ) {
          noConfigConflicts = false;
          break;
        }
      } else {
        allowedConfig[key] = f.frontendForcedConfig[key] as
          | string[]
          | boolean[];
      }
    }
  }

  return (
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
    onePunctuateWordMax &&
    oneGetEmulatedCharMax &&
    oneCharCheckerMax &&
    oneCharReplacerMax &&
    oneChangesCapitalisationMax &&
    oneCssModificationPerElement &&
    noConfigConflicts &&
    oneWordOrderMax
  );
}
