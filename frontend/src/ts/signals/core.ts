import { createSignal } from "solid-js";
import { PageName } from "../pages/page";

export type ThemeIndicator = {
  text: string;
  isFavorite: boolean;
};

export const [getActivePage, setActivePage] = createSignal<PageName>("loading");
export const [getVersion, setVersion] = createSignal<{
  text: string;
  isNew: boolean;
}>({
  text: "",
  isNew: false,
});

export const [getThemeIndicator, setThemeIndicator] =
  createSignal<ThemeIndicator>({ text: "unknown", isFavorite: false });
