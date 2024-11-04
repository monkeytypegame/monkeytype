import _ from "lodash";
import { default as FunboxList } from "../constants/funbox-list";
import { CompletedEvent } from "@monkeytype/contracts/schemas/results";
import { intersect } from "@monkeytype/util/arrays";

export function isTestTooShort(result: CompletedEvent): boolean {
  const { mode, mode2, customText, testDuration, bailedOut } = result;

  if (mode === "time") {
    const seconds = parseInt(mode2);

    const setTimeTooShort = seconds > 0 && seconds < 15;
    const infiniteTimeTooShort = seconds === 0 && testDuration < 15;
    const bailedOutTooShort = bailedOut
      ? bailedOut && testDuration < 15
      : false;
    return setTimeTooShort || infiniteTimeTooShort || bailedOutTooShort;
  }

  if (mode === "words") {
    const wordCount = parseInt(mode2);

    const setWordTooShort = wordCount > 0 && wordCount < 10;
    const infiniteWordTooShort = wordCount === 0 && testDuration < 15;
    const bailedOutTooShort = bailedOut
      ? bailedOut && testDuration < 15
      : false;
    return setWordTooShort || infiniteWordTooShort || bailedOutTooShort;
  }

  if (mode === "custom") {
    if (!customText) return true;
    const wordLimitTooShort =
      (customText.limit.mode === "word" ||
        customText.limit.mode === "section") &&
      customText.limit.value < 10;
    const timeLimitTooShort =
      customText.limit.mode === "time" && customText.limit.value < 15;
    const bailedOutTooShort = bailedOut
      ? bailedOut && testDuration < 15
      : false;
    return wordLimitTooShort || timeLimitTooShort || bailedOutTooShort;
  }

  if (mode === "zen") {
    return testDuration < 15;
  }

  return false;
}

export function areFunboxesCompatible(funboxesString: string): boolean {
  const funboxes = funboxesString.split("#").filter((f) => f !== "none");

  const funboxesToCheck = FunboxList.filter((f) => funboxes.includes(f.name));

  const allFunboxesAreValid = funboxesToCheck.length === funboxes.length;
  const oneWordModifierMax =
    funboxesToCheck.filter(
      (f) =>
        f.frontendFunctions?.includes("getWord") ??
        f.frontendFunctions?.includes("pullSection") ??
        f.frontendFunctions?.includes("withWords")
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
  const oneWordOrderMax =
    funboxesToCheck.filter((f) =>
      f.properties?.find((fp) => fp.startsWith("wordOrder"))
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
  const canSpeak =
    funboxesToCheck.filter((f) =>
      f.properties?.find((fp) => fp === "speaks" || fp === "unspeakable")
    ).length <= 1;
  const hasLanguageToSpeak =
    funboxesToCheck.filter((f) => f.properties?.find((fp) => fp === "speaks"))
      .length === 0 ||
    funboxesToCheck.filter((f) =>
      f.properties?.find((fp) => fp === "ignoresLanguage")
    ).length === 0;
  const oneToPushOrPullSectionMax =
    funboxesToCheck.filter(
      (f) =>
        f.properties?.some((fp) => fp.startsWith("toPush:")) ??
        f.frontendFunctions?.includes("pullSection")
    ).length <= 1;
  // const oneApplyCSSMax =
  //   funboxesToCheck.filter((f) => f.frontendFunctions?.includes("applyCSS"))
  //     .length <= 1; //todo: move all funbox stuff to the shared package, this is ok to remove for now
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
  const allowedConfig = {} as Record<string, string[] | boolean[]>;
  let noConfigConflicts = true;
  for (const f of funboxesToCheck) {
    if (!f.frontendForcedConfig) continue;
    for (const key in f.frontendForcedConfig) {
      const allowedConfigValue = allowedConfig[key];
      const funboxValue = f.frontendForcedConfig[key];
      if (allowedConfigValue !== undefined && funboxValue !== undefined) {
        if (
          intersect<string | boolean>(allowedConfigValue, funboxValue, true)
            .length === 0
        ) {
          noConfigConflicts = false;
          break;
        }
      } else if (funboxValue !== undefined) {
        allowedConfig[key] = funboxValue;
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
    canSpeak &&
    hasLanguageToSpeak &&
    oneToPushOrPullSectionMax &&
    // oneApplyCSSMax &&
    onePunctuateWordMax &&
    oneCharCheckerMax &&
    oneCharReplacerMax &&
    oneChangesCapitalisationMax &&
    noConfigConflicts &&
    oneWordOrderMax
  );
}
