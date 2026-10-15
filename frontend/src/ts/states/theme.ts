import { createSignal } from "solid-js";
import { ColorName, Theme } from "../constants/themes";
import { ThemeName } from "@monkeytype/schemas/configs";

export type ThemeIdentifier = ThemeName | "custom";
const defaultTheme: Theme & { name: ThemeIdentifier } = {
  name: "recurse",
  bg: "#080a09",
  main: "#6dffb0",
  caret: "#6dffb0",
  sub: "#55635b",
  subAlt: "#0e1311",
  text: "#dfe8e2",
  error: "#ff5a5f",
  errorExtra: "#9c3a3d",
  colorfulError: "#ff5a5f",
  colorfulErrorExtra: "#9c3a3d",
};

export const [getTheme, setTheme] = createSignal(defaultTheme);

export function updateThemeColor(key: ColorName, color: string): void {
  setTheme((prev) => ({
    ...prev,
    [key]: color,
  }));
}
