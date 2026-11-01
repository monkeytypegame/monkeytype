import { createSignal } from "solid-js";
import { ColorName, Theme } from "../constants/themes";
import { ThemeName } from "@monkeytype/schemas/configs";

export type ThemeIdentifier = ThemeName | "custom";
const defaultTheme: Theme & { name: ThemeIdentifier } = {
  name: "serika_dark",
  bg: "#323437",
  main: "#e2b714",
  caret: "#e2b714",
  sub: "#646669",
  subAlt: "#2c2e31",
  text: "#d1d0c5",
  error: "#ca4754",
  errorExtra: "#7e2a33",
  colorfulError: "#ca4754",
  colorfulErrorExtra: "#7e2a33",
};

export const [getTheme, setTheme] = createSignal(defaultTheme);

/** The `:root` color variables for `theme`. */
export function getThemeColorsCss(theme: Theme): string {
  return `
:root {
    --bg-color: ${theme.bg};
    --main-color: ${theme.main};
    --caret-color: ${theme.caret};
    --sub-color: ${theme.sub};
    --sub-alt-color: ${theme.subAlt};
    --text-color: ${theme.text};
    --error-color: ${theme.error};
    --error-extra-color: ${theme.errorExtra};
    --colorful-error-color: ${theme.colorfulError};
    --colorful-error-extra-color: ${theme.colorfulErrorExtra};
}`;
}

/**
 * Stores the configured theme's colors for the inline script in index.html,
 * which applies them before the first paint to avoid an initial flash of the
 * default theme. Not for previews.
 */
export function cacheThemeColors(theme: Theme): void {
  localStorage.setItem("firstPaintThemeCss", getThemeColorsCss(theme));
}

export function updateThemeColor(key: ColorName, color: string): void {
  setTheme((prev) => ({
    ...prev,
    [key]: color,
  }));
}

// slider values while dragging in settings, before they are saved to the config
export const [
  getCustomBackgroundFilterPreview,
  setCustomBackgroundFilterPreview,
] = createSignal<[number, number, number, number] | null>(null);
// whether the custom background image is loaded (set by CustomBackground)
export const [isCustomBackgroundLoaded, setCustomBackgroundLoaded] =
  createSignal(false);
