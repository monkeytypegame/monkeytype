// Shared custom theme links (?customTheme=): built by the custom theme
// settings, a url action (../action.ts)

import {
  CustomBackgroundFilter,
  CustomBackgroundFilterSchema,
  CustomBackgroundSize,
  CustomBackgroundSizeSchema,
  CustomThemeColors,
  CustomThemeColorsSchema,
} from "@monkeytype/schemas/configs";
import { parseWithSchema as parseJsonWithSchema } from "@monkeytype/util/json";
import { z } from "zod";

import { setConfig } from "../../config/setters";
import { Config } from "../../config/store";
import { showSuccessNotification } from "../../states/notifications";
import { UrlSearchAction, urlActionLink } from "../action";

export const customThemeAction: UrlSearchAction = {
  in: "search",
  param: "customTheme",
  failure: "Failed to load theme from URL",
  apply: (value) => applyCustomTheme(decodeCustomTheme(value)),
};

/** A shared custom theme: its colors, and optionally its background. */
export type SharedCustomTheme = {
  colors: CustomThemeColors;
  background?: {
    image: string;
    size: CustomBackgroundSize;
    filter: CustomBackgroundFilter;
  };
};

const CustomThemeUrlDataSchema = z.union([
  z.object({
    c: CustomThemeColorsSchema,
    i: z.string().optional(),
    s: CustomBackgroundSizeSchema.optional(),
    f: CustomBackgroundFilterSchema.optional(),
  }),
  // the old format: the colors only
  CustomThemeColorsSchema,
]);

export function encodeCustomTheme(theme: SharedCustomTheme): string {
  return btoa(
    JSON.stringify({
      c: theme.colors,
      i: theme.background?.image,
      s: theme.background?.size,
      f: theme.background?.filter,
    }),
  );
}

/** The link sharing `theme`. */
export function customThemeLink(theme: SharedCustomTheme): string {
  return urlActionLink(customThemeAction, encodeCustomTheme(theme));
}

/** Throws if `value` isn't a shared custom theme. */
export function decodeCustomTheme(value: string): SharedCustomTheme {
  const data = parseJsonWithSchema(atob(value), CustomThemeUrlDataSchema);
  if (Array.isArray(data)) return { colors: data };

  const { c, i, s, f } = data;
  if (i === undefined || s === undefined || f === undefined) {
    return { colors: c };
  }
  return { colors: c, background: { image: i, size: s, filter: f } };
}

function applyCustomTheme(theme: SharedCustomTheme): void {
  const oldCustomTheme = Config.customTheme;
  const oldCustomThemeColors = Config.customThemeColors;
  try {
    setConfig("customThemeColors", theme.colors);

    if (theme.background !== undefined) {
      setConfig("customBackground", theme.background.image);
      setConfig("customBackgroundSize", theme.background.size);
      setConfig("customBackgroundFilter", theme.background.filter);
    }

    if (!Config.customTheme) setConfig("customTheme", true);
  } catch (e) {
    // the action's error notification says what went wrong
    setConfig("customTheme", oldCustomTheme);
    setConfig("customThemeColors", oldCustomThemeColors);
    throw e;
  }

  showSuccessNotification("Custom theme applied");
}
