import { createMemo, createRoot } from "solid-js";
import { ThemeName } from "@monkeytype/schemas/configs";
import { getConfig } from "../config/store";
import { getCustomThemes } from "../queries/custom-themes";
import { getRandomTheme, getThemePreview } from "./state";
import { areSortedArraysEqual } from "../utils/arrays";

export type ThemeIndicator = {
  /**
   * human readable display name, this is not the ThemeName.
   * e.g. the display is `serika dark` for the ThemeName `serika_dark`
   */
  text: string;
  isFavorite: boolean;
};

/** The footer's theme name and favorite star. */
export const getThemeIndicator = createRoot(() =>
  createMemo((): ThemeIndicator => {
    const preview = getThemePreview()?.name;
    const random = getRandomTheme()?.name;

    let text: string = random ?? getConfig.theme;

    if (getConfig.customTheme && preview === undefined) {
      // Match current custom theme by colors since Config does not store custom theme IDs
      const matchedTheme = getCustomThemes().find((ct) =>
        areSortedArraysEqual(ct.colors, getConfig.customThemeColors),
      );
      text = matchedTheme ? `${matchedTheme.name} (custom)` : "custom";
    }

    if (preview !== undefined) text = preview;

    const current = preview ?? random ?? getConfig.theme;
    const isFavorite =
      !getConfig.customTheme &&
      getConfig.favThemes.includes(current as ThemeName);

    return { text: text.replace(/_/g, " "), isFavorite };
  }),
);
