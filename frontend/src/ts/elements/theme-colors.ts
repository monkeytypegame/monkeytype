import {
  ColorName,
  getThemeColors,
  setThemeColors,
  resetThemeColors,
  ThemeColors,
} from "../signals/theme";

export async function get(color: ColorName): Promise<string> {
  return getThemeColors()[color];
}

export async function getAll(): Promise<ThemeColors> {
  if (!getThemeColors().bg) update();
  return getThemeColors();
}

export function reset(): void {
  resetThemeColors();
}

export function update(): void {
  const st = getComputedStyle(document.body);

  setThemeColors({
    bg: st.getPropertyValue("--bg-color").replace(" ", ""),
    main: st.getPropertyValue("--main-color").replace(" ", ""),
    caret: st.getPropertyValue("--caret-color").replace(" ", ""),
    sub: st.getPropertyValue("--sub-color").replace(" ", ""),
    subAlt: st.getPropertyValue("--sub-alt-color").replace(" ", ""),
    text: st.getPropertyValue("--text-color").replace(" ", ""),
    error: st.getPropertyValue("--error-color").replace(" ", ""),
    errorExtra: st.getPropertyValue("--error-extra-color").replace(" ", ""),
    colorfulError: st
      .getPropertyValue("--colorful-error-color")
      .replace(" ", ""),
    colorfulErrorExtra: st
      .getPropertyValue("--colorful-error-extra-color")
      .replace(" ", ""),
  });
}
