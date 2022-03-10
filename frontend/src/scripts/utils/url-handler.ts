import * as Misc from "../misc";
import Config, * as UpdateConfig from "../config";
import * as Notifications from "../elements/notifications";

export function loadCustomThemeFromUrl(): void {
  const getValue = Misc.findGetParameter("customTheme");
  if (getValue === null) return;

  const urlEncoded = getValue.split(",");
  let base64decoded = null;
  try {
    base64decoded = JSON.parse(atob(getValue) ?? "");
  } catch (e) {
    //
  }

  let colorArray = [];
  if (Array.isArray(urlEncoded) && urlEncoded.length === 9) {
    colorArray = urlEncoded;
  } else if (Array.isArray(base64decoded) && base64decoded.length === 9) {
    colorArray = base64decoded;
  }

  if (colorArray.length === 0) {
    return Notifications.add("Invalid custom theme ", 0);
  }

  const oldCustomTheme = Config.customTheme;
  const oldCustomThemeColors = Config.customThemeColors;
  try {
    UpdateConfig.setCustomThemeColors(colorArray);
    Notifications.add("Custom theme applied", 1);

    if (!Config.customTheme) UpdateConfig.setCustomTheme(true);
  } catch (e) {
    Notifications.add("Something went wrong. Reverting to previous state.", 0);
    console.error(e);
    UpdateConfig.setCustomTheme(oldCustomTheme);
    UpdateConfig.setCustomThemeColors(oldCustomThemeColors);
  }
}
