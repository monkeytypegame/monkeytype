import { createSignal } from "solid-js";
import { ColorName, Theme } from "../constants/themes";
import { ThemeName } from "@monkeytype/schemas/configs";

export type ThemeIdentifier = ThemeName | "custom";
const defaultTheme: Theme & { name: ThemeIdentifier } = {
  name: "recurse",
  bg: "#080a09",
  main: "#a8ff35",
  caret: "#a8ff35",
  sub: "#5c645e",
  subAlt: "#111613",
  text: "#f3f4ef",
  error: "#ff5a5a",
  errorExtra: "#9e3434",
  colorfulError: "#ff5a5a",
  colorfulErrorExtra: "#9e3434",
};

export const [getTheme, setTheme] = createSignal(defaultTheme);

export function updateThemeColor(key: ColorName, color: string): void {
  setTheme((prev) => ({
    ...prev,
    [key]: color,
  }));
}
