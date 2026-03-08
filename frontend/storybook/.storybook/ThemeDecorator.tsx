import type { ThemeName } from "@monkeytype/schemas/configs";
import type { JSXElement } from "solid-js";

import { ThemesList, ThemeWithName } from "../../src/ts/constants/themes";

type StoryContext = {
  globals: { theme?: string };
};

const themeMap = new Map(ThemesList.map((t) => [t.name, t]));

let currentThemeLink: HTMLLinkElement | null = null;

export function ThemeDecorator(
  Story: () => JSXElement,
  context: StoryContext,
): JSXElement {
  const themeName = (context.globals.theme ?? "serika_dark") as ThemeName;
  const theme =
    themeMap.get(themeName) ?? (themeMap.get("serika_dark") as ThemeWithName);

  const root = document.documentElement;
  root.style.setProperty("--bg-color", theme.bg);
  root.style.setProperty("--main-color", theme.main);
  root.style.setProperty("--caret-color", theme.caret);
  root.style.setProperty("--sub-color", theme.sub);
  root.style.setProperty("--sub-alt-color", theme.subAlt);
  root.style.setProperty("--text-color", theme.text);
  root.style.setProperty("--error-color", theme.error);
  root.style.setProperty("--error-extra-color", theme.errorExtra);
  root.style.setProperty("--colorful-error-color", theme.colorfulError);
  root.style.setProperty(
    "--colorful-error-extra-color",
    theme.colorfulErrorExtra,
  );

  // Load/unload theme CSS file
  if (currentThemeLink) {
    currentThemeLink.remove();
    currentThemeLink = null;
  }
  if (theme.hasCss) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `/themes/${themeName}.css`;
    document.head.appendChild(link);
    currentThemeLink = link;
  }

  return Story();
}
