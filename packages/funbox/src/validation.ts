import { intersect } from "@monkeytype/util/arrays";
import { FunboxForcedConfig, FunboxName } from "./types";
import { getFunbox } from "./list";

export function checkCompatibility(
  funboxNames: FunboxName[],
  withFunbox?: FunboxName
): boolean {
  if (funboxNames.length === 0) return true;
  let funboxesToCheck = getFunbox(funboxNames);

  const allFunboxesAreValid = funboxesToCheck.every((f) => f !== undefined);
  if (!allFunboxesAreValid) return false;

  if (withFunbox !== undefined) {
    funboxesToCheck = funboxesToCheck.concat(getFunbox(withFunbox));
  }

  const oneWordModifierMax =
    funboxesToCheck.filter(
      (f) =>
        f.frontendFunctions?.includes("getWord") ??
        f.frontendFunctions?.includes("pullSection") ??
        f.frontendFunctions?.includes("withWords")
    ).length <= 1;
  const oneWordOrderMax =
    funboxesToCheck.filter((f) =>
      f.properties?.find((fp) => fp.startsWith("wordOrder"))
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
        f.frontendFunctions?.includes("pullSection")
    ).length <= 1;
  const onePunctuateWordMax =
    funboxesToCheck.filter((f) =>
      f.frontendFunctions?.includes("punctuateWord")
    ).length <= 1;
  const oneCharCheckerMax =
    funboxesToCheck.filter((f) =>
      f.frontendFunctions?.includes("isCharCorrect")
    ).length <= 1;
  const oneCharReplacerMax =
    funboxesToCheck.filter((f) => f.frontendFunctions?.includes("getWordHtml"))
      .length <= 1;
  const oneChangesCapitalisationMax =
    funboxesToCheck.filter((f) =>
      f.properties?.find((fp) => fp === "changesCapitalisation")
    ).length <= 1;

  const oneCssModificationPerElement = Object.values(
    funboxesToCheck
      .map((f) => f.cssModifications)
      .filter((f) => f !== undefined)
      .flat()
      .reduce<Record<string, number>>((counts, cssModification) => {
        counts[cssModification] = (counts[cssModification] || 0) + 1;
        return counts;
      }, {})
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
            true
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
    oneCharCheckerMax &&
    oneCharReplacerMax &&
    oneChangesCapitalisationMax &&
    oneCssModificationPerElement &&
    noConfigConflicts &&
    oneWordOrderMax
  );
}
