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

export const [getTheme, setTheme] = createSignal<
  Theme & { name: ThemeIdentifier }
>(defaultTheme);

export function updateThemeColor(key: ColorName, color: string): void {
  setTheme((prev) => ({
    ...prev,
    [key]: color,
  }));
}
