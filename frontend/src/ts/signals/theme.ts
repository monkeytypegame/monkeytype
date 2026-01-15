import { createSignal } from "solid-js";
import { ColorName, Theme } from "../constants/themes";

const defaultTheme: Theme = {
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

export const [getThemeColors, setThemeColor] =
  createSignal<Theme>(defaultTheme);

export function updateThemeColor(key: ColorName, color: string): void {
  setThemeColor((prev) => ({
    ...prev,
    [key]: color,
  }));
}
