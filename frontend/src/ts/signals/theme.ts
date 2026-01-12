import { createSignal } from "solid-js";

export type ThemeColors = {
  bg: string;
  main: string;
  caret: string;
  sub: string;
  subAlt: string;
  text: string;
  error: string;
  errorExtra: string;
  colorfulError: string;
  colorfulErrorExtra: string;
};
export type ColorName = keyof ThemeColors;

export const [getThemeColors, setThemeColors] = createSignal<ThemeColors>({
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
});
