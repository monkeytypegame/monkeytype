import _ from "lodash";
import { replaceHomoglyphs } from "../constants/homoglyphs";
import { profanities, regexProfanities } from "../constants/profanities";
import { intersect, matchesAPattern, sanitizeString } from "./misc";
import { default as FunboxList } from "../constants/funbox-list";
import { z } from 'zod';

// Utility function to check if a value is in a specified range
export function inRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

// Zod schema for username validation
const usernameSchema = z.string().regex(/^[\da-zA-Z_.-]+$/).min(1).max(16);

// Function to check if the username is valid
export function isUsernameValid(name: string): boolean {
  if (_.isNil(name)) return false;

  try {
    usernameSchema.parse(name);
  } catch {
    return false;
  }

  const normalizedName = name.toLowerCase();
  if (normalizedName.startsWith('.')) return false;
  if (profanities.some(profanity => normalizedName.includes(profanity))) return false;

  return true;
}

// Function to check if a text contains profanity
export function containsProfanity(text: string): boolean {
  const normalizedText = text
    .toLowerCase()
    .split(/[.,"/#!?$%^&*;:{}=\-_`~()\s\n]+/g)
    .map(str => replaceHomoglyphs(sanitizeString(str) ?? ""));

  return regexProfanities.some(profanity =>
    normalizedText.some(word => matchesAPattern(word, profanity))
  );
}

// Function to check if a tag preset name is valid
export function isTagPresetNameValid(name: string): boolean {
  if (_.isNil(name)) return false;

  try {
    usernameSchema.parse(name);
  } catch {
    return false;
  }

  return true;
}

// SharedTypes.CompletedEvent type definition (you should define this according to your actual type)
type CompletedEvent = {
  mode: string;
  mode2: string;
  customText?: { limit: { mode: string; value: number } };
  testDuration: number;
  bailedOut?: boolean;
};

// Function to check if a test duration is too short
export function isTestTooShort(result: CompletedEvent): boolean {
  const { mode, mode2, customText, testDuration, bailedOut } = result;

  if (mode === "time") {
    const seconds = parseInt(mode2);
    return (
      (seconds > 0 && seconds < 15) ||
      (seconds === 0 && testDuration < 15) ||
      (bailedOut && testDuration < 15)
    );
  }

  if (mode === "words") {
    const wordCount = parseInt(mode2);
    return (
      (wordCount > 0 && wordCount < 10) ||
      (wordCount === 0 && testDuration < 15) ||
      (bailedOut && testDuration < 15)
    );
  }

  if (mode === "custom") {
    if (!customText) return true;
    const { limit } = customText;
    return (
      (["word", "section"].includes(limit.mode) && limit.value < 10) ||
      (limit.mode === "time" && limit.value < 15) ||
      (bailedOut && testDuration < 15)
    );
  }

  if (mode === "zen") {
    return testDuration < 15;
  }

  return false;
}

// Function to check if funboxes are compatible
export function areFunboxesCompatible(funboxesString: string): boolean {
  const funboxes = funboxesString.split("#").filter(f => f !== "none");
  const funboxesToCheck = FunboxList.filter(f => funboxes.includes(f.name));

  const allFunboxesAreValid = funboxesToCheck.length === funboxes.length;
  const oneWordModifierMax = funboxesToCheck.filter(f => f.frontendFunctions?.some(fn => ["getWord", "pullSection", "withWords"].includes(fn))).length <= 1;
  const layoutUsability = funboxesToCheck.every(f => !f.properties?.includes("changesLayout")) || funboxesToCheck.every(f => ["ignoresLayout", "usesLayout"].some(fp => f.properties?.includes(fp)));
  const oneNospaceOrToPushMax = funboxesToCheck.filter(f => f.properties?.some(fp => ["nospace", "toPush"].includes(fp))).length <= 1;
  const oneWordOrderMax = funboxesToCheck.filter(f => f.properties?.some(fp => fp.startsWith("wordOrder"))).length <= 1;
  const oneChangesWordsVisibilityMax = funboxesToCheck.filter(f => f.properties?.includes("changesWordsVisibility")).length <= 1;
  const oneFrequencyChangesMax = funboxesToCheck.filter(f => f.properties?.includes("changesWordsFrequency")).length <= 1;
  const noFrequencyChangesConflicts = funboxesToCheck.every(f => !f.properties?.includes("changesWordsFrequency")) || funboxesToCheck.every(f => !f.properties?.includes("ignoresLanguage"));
  const capitalisationChangePosibility = funboxesToCheck.every(f => !f.properties?.includes("noLetters")) || funboxesToCheck.every(f => !f.properties?.includes("changesCapitalisation"));
  const noConflictsWithSymmetricChars = funboxesToCheck.every(f => !f.properties?.includes("conflictsWithSymmetricChars")) || funboxesToCheck.every(f => !f.properties?.includes("symmetricChars"));
  const canSpeak = funboxesToCheck.filter(f => ["speaks", "unspeakable"].some(fp => f.properties?.includes(fp))).length <= 1;
  const hasLanguageToSpeak = funboxesToCheck.every(f => !f.properties?.includes("speaks")) || funboxesToCheck.every(f => !f.properties?.includes("ignoresLanguage"));
  const oneToPushOrPullSectionMax = funboxesToCheck.filter(f => ["toPush:", "pullSection"].some(fp => f.properties?.includes(fp) || f.frontendFunctions?.includes(fp))).length <= 1;
  const oneApplyCSSMax = funboxesToCheck.filter(f => f.frontendFunctions?.includes("applyCSS")).length <= 1;
  const onePunctuateWordMax = funboxesToCheck.filter(f => f.frontendFunctions?.includes("punctuateWord")).length <= 1;
  const oneCharCheckerMax = funboxesToCheck.filter(f => f.frontendFunctions?.includes("isCharCorrect")).length <= 1;
  const oneCharReplacerMax = funboxesToCheck.filter(f => f.frontendFunctions?.includes("getWordHtml")).length <= 1;

  const allowedConfig: Record<string, (string | boolean)[]> = {};
  let noConfigConflicts = true;
  for (const f of funboxesToCheck) {
    if (!f.frontendForcedConfig) continue;
    for (const key in f.frontendForcedConfig) {
      const allowedConfigValue = allowedConfig[key];
      const funboxValue = f.frontendForcedConfig[key];
      if (allowedConfigValue !== undefined && funboxValue !== undefined) {
        if (intersect<string | boolean>(allowedConfigValue, funboxValue, true).length === 0) {
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
    oneApplyCSSMax &&
    onePunctuateWordMax &&
    oneCharCheckerMax &&
    oneCharReplacerMax &&
    noConfigConflicts &&
    oneWordOrderMax
  );
}
