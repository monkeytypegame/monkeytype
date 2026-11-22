import { createRoot } from "solid-js";
import { getConfig } from "../config/store";
import { createEffectOn } from "../hooks/effects";
import {
  cacheThemeColors,
  clearThemePreview,
  getConfiguredTheme,
  getConfiguredThemeName,
  setCustomThemeDraft,
  setRandomTheme,
} from "./state";
import { updateThemeList } from "./random";

export { clearThemePreview, previewTheme } from "./state";
export { randomizeTheme } from "./random";

// a root so the effects are owned, they live as long as the page
createRoot(() => {
  // a newly configured theme replaces whatever is shown over it
  createEffectOn(
    [getConfiguredThemeName, () => [...getConfig.customThemeColors]] as const,
    () => {
      setRandomTheme(null);
      clearThemePreview();
      setCustomThemeDraft(null);
    },
    { defer: true },
  );

  createEffectOn(getConfiguredTheme, (theme) => cacheThemeColors(theme), {
    defer: true,
  });

  createEffectOn(
    () => getConfig.randomTheme,
    (value) => {
      updateThemeList();
      if (value === "off") setRandomTheme(null);
    },
    { defer: true },
  );
});
