import { createMemo, createRoot, createSignal } from "solid-js";
import { debounce } from "throttle-debounce";
import { ColorName, Theme, themes } from "../constants/themes";
import { CustomThemeColors, ThemeName } from "@monkeytype/schemas/configs";
import { getConfig } from "../config/store";
import { convertCustomColorsToTheme } from "../utils/colors";

export type ThemeIdentifier = ThemeName | "custom";

export type ThemeChoice = {
  name: ThemeIdentifier;
  colors?: CustomThemeColors;
};

export type AppliedTheme = Theme & { name: ThemeIdentifier };

// shown over the configured theme while set
export const [getRandomTheme, setRandomTheme] =
  createSignal<ThemeChoice | null>(null);

// shown over everything while set: hovering a theme in the commandline
const [getThemePreview, setThemePreview] = createSignal<ThemeChoice | null>(
  null,
);
export { getThemePreview };

let pendingPreview: ThemeChoice | null = null;

const debouncedPreview = debounce<() => void>(250, () => {
  if (pendingPreview !== null) setThemePreview(pendingPreview);
});

/** Shows `theme` over the current one, after a short debounce. */
export function previewTheme(
  theme: ThemeIdentifier,
  customColors?: CustomThemeColors,
): void {
  pendingPreview = { name: theme, colors: customColors };
  debouncedPreview();
}

export function clearThemePreview(): void {
  pendingPreview = null;
  setThemePreview(null);
}

// the custom theme editor's unsaved colors, shown while the configured theme
// is custom
export const [getCustomThemeDraft, setCustomThemeDraft] =
  createSignal<Theme | null>(null);

const darkSchemeQuery = window.matchMedia?.("(prefers-color-scheme: dark)");
const [prefersDarkScheme, setPrefersDarkScheme] = createSignal(
  darkSchemeQuery?.matches ?? false,
);
darkSchemeQuery?.addEventListener?.("change", (event) =>
  setPrefersDarkScheme(event.matches),
);
export { prefersDarkScheme };

function resolveTheme(choice: ThemeChoice): AppliedTheme {
  const colors =
    choice.name === "custom"
      ? convertCustomColorsToTheme(choice.colors ?? getConfig.customThemeColors)
      : themes[choice.name];
  return { ...colors, name: choice.name };
}

const theme = createRoot(() => {
  const getConfiguredThemeName = createMemo((): ThemeIdentifier => {
    if (getConfig.autoSwitchTheme) {
      return prefersDarkScheme() ? getConfig.themeDark : getConfig.themeLight;
    }
    return getConfig.customTheme ? "custom" : getConfig.theme;
  });

  const getConfiguredTheme = createMemo(() =>
    resolveTheme({ name: getConfiguredThemeName() }),
  );

  const getTheme = createMemo((): AppliedTheme => {
    const preview = getThemePreview();
    if (preview !== null) return resolveTheme(preview);

    const random = getRandomTheme();
    if (random !== null) return resolveTheme(random);

    const draft = getCustomThemeDraft();
    if (draft !== null && getConfiguredThemeName() === "custom") {
      return { ...draft, name: "custom" };
    }

    return getConfiguredTheme();
  });

  return { getConfiguredThemeName, getConfiguredTheme, getTheme };
});

/** The theme from the config, auto switch included. */
export const getConfiguredThemeName = theme.getConfiguredThemeName;
/** The configured theme's colors: what the first paint cache stores. */
export const getConfiguredTheme = theme.getConfiguredTheme;
/** The theme on screen: preview, then random, then draft, then configured. */
export const getTheme = theme.getTheme;

/** Edits one color of the custom theme editor's draft. */
export function updateCustomThemeDraftColor(
  key: ColorName,
  color: string,
): void {
  setCustomThemeDraft((prev) => ({
    ...(prev ?? convertCustomColorsToTheme(getConfig.customThemeColors)),
    [key]: color,
  }));
}
