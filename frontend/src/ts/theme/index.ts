import { createRoot } from "solid-js";
import { getConfig } from "../config/store";
import { createEffectOn } from "../hooks/effects";
import {
  clearThemePreview,
  getConfiguredThemeName,
  setCustomThemeDraft,
  setRandomTheme,
} from "./state";
import { updateThemeList } from "./random";
import { initWallpaperTheme } from "./wallpaper";

export { clearThemePreview, previewTheme } from "./state";
export { randomizeTheme } from "./random";

// a root so the effects are owned, they live as long as the page
createRoot(() => {
  initWallpaperTheme();

  // a newly configured theme replaces whatever is shown over it; switching to
  // or from the wallpaper palette also drops the custom editor's unsaved colors
  createEffectOn(
    [
      getConfiguredThemeName,
      () => [...getConfig.customThemeColors],
      () => getConfig.wallpaperTheme,
    ] as const,
    () => {
      setRandomTheme(null);
      clearThemePreview();
      setCustomThemeDraft(null);
    },
    { defer: true },
  );

  createEffectOn(
    () => getConfig.randomTheme,
    (value) => {
      updateThemeList();
      if (value === "off") setRandomTheme(null);
    },
    { defer: true },
  );
});
