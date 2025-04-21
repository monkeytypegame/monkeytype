import * as UpdateConfig from "../../config";
import {
  capitalizeFirstLetterOfEachWord,
  getLanguageDisplayString,
} from "../../utils/strings";
import { Command, CommandsSubgroup } from "../types";
import * as TestLogic from "../../test/test-logic";
import { LayoutsList } from "../../constants/layouts";

const subgroup: CommandsSubgroup = {
  title: "Language...",
  configKey: "language",
  list: [
    {
      id: "couldnotload",
      display: "Could not load the languages list :(",
    },
  ],
};

const commands: Command[] = [
  {
    id: "changeLanguage",
    display: "Language...",
    icon: "fa-language",
    subgroup,
  },
];

/**
 * Intelligently maps a language to the most appropriate keyboard layout
 */
function findLayoutForLanguage(language: string): string {
  // Strip word count suffix (e.g., "english_1k" -> "english")
  const baseLanguage = language.replace(/_\d+k$/i, "");

  // Direct matching - check if there's a layout with the exact language name
  if (LayoutsList.includes(baseLanguage)) {
    return baseLanguage;
  }

  // Check for language-specific layout patterns
  const layoutMatches = LayoutsList.filter(
    (layout) => layout.includes(baseLanguage) || baseLanguage.includes(layout)
  );

  if (layoutMatches.length > 0) {
    // If we found layouts containing the language name, prefer the most specific one
    return layoutMatches.sort((a, b) => b.length - a.length)[0] ?? "qwerty";
  }

  // Special case mappings for common languages
  const specialMappings: Record<string, string> = {
    english: "qwerty",
    french: "azerty",
    german: "qwertz",
    spanish: "spanish_qwerty",
    italian: "italian_qwerty",
    portuguese: "portuguese_pt_qwerty_iso",
    russian: "russian",
    japanese: "japanese_hiragana",
    korean: "korean",
    turkish: "turkish_q",
    arabic: "arabic_101",
    persian: "persian_standard",
    hebrew: "hebrew",
    mongolian: "mongolian",
    // Add more mappings as needed
  };

  const specialMapping = specialMappings[baseLanguage];
  if (specialMapping === null) {
    return "qwerty";
  }

  // Regional fall-backs based on common orthographic patterns
  if (
    baseLanguage.includes("cyrillic") ||
    baseLanguage.includes("bulgarian") ||
    baseLanguage.includes("ukrainian") ||
    baseLanguage.includes("belarusian")
  ) {
    return "russian";
  }

  if (baseLanguage.includes("latin") || baseLanguage.includes("romance")) {
    return "qwerty";
  }

  // Default to qwerty if no match is found
  return "qwerty";
}

function update(languages: string[]): void {
  subgroup.list = [];
  languages.forEach((language) => {
    subgroup.list.push({
      id: "changeLanguage" + capitalizeFirstLetterOfEachWord(language),
      display: getLanguageDisplayString(language),
      configValue: language,
      exec: (): void => {
        UpdateConfig.setLanguage(language);
        // Find appropriate layout for this language
        const appropriateLayout = findLayoutForLanguage(language);

        // Update the keymap layout
        UpdateConfig.setKeymapLayout(appropriateLayout);
        TestLogic.restart();
      },
    });
  });
}

export default commands;
export { update };
