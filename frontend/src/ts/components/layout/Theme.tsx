import { createEffect, createMemo, JSXElement } from "solid-js";
import { getThemeColors } from "../../signals/theme";
import { useRefWithUtils } from "../../hooks/useRefWithUtils";
import { getThemeIndicator } from "../../signals/core";
import { themes, Theme as ThemeType } from "../../constants/themes";
import { ThemeName } from "@monkeytype/schemas/configs";
import { qsr } from "../../utils/dom";

export function Theme(): JSXElement {
  // Refs are assigned by SolidJS via the ref attribute
  const [styleRef, styleEl] = useRefWithUtils<HTMLStyleElement>();

  //Use memo to ignore signals without changes
  const themeName = createMemo(() => getThemeIndicator().text);
  const themeColors = createMemo(() => getThemeColors());

  createEffect(() => {
    const colors = themeColors();
    styleEl()?.setHtml(`
:root {

    --bg-color: ${colors.bg};
    --main-color: ${colors.main};
    --caret-color: ${colors.caret};
    --sub-color: ${colors.sub};
    --sub-alt-color: ${colors.subAlt};
    --text-color: ${colors.text};
    --error-color: ${colors.error};
    --error-extra-color:${colors.errorExtra};
    --colorful-error-color: ${colors.colorfulError};
    --colorful-error-extra-color: ${colors.colorfulErrorExtra};
}
        `);
  });

  createEffect(() => {
    const theme: ThemeType | undefined = themes[themeName() as ThemeName];

    const cssFile = theme?.hasCss ? `/themes/${themeName()}.css` : "";

    //TODO move the code here or add loader animation?
    //void loadStyle(themeName(), { hasCss: theme?.hasCss ?? false });

    const linkElement = qsr("#currentTheme").setAttribute("href", cssFile);
    const parent = qsr("head");
    linkElement.remove();
    parent.append(linkElement);
  });

  return (
    <>
      <style ref={styleRef}></style>;
      <link rel="stylesheet" id="currentTheme" />
    </>
  );
}
