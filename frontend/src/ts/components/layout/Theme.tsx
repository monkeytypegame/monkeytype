import { createEffect, createMemo, JSXElement } from "solid-js";
import { getThemeColors } from "../../signals/theme";
import { useRefWithUtils } from "../../hooks/useRefWithUtils";
import { getThemeIndicator } from "../../signals/core";
import { themes, Theme as ThemeType } from "../../constants/themes";
import { ThemeName } from "@monkeytype/schemas/configs";
import * as Loader from "../../elements/loader";
import * as Notifications from "../../elements/notifications";

export function Theme(): JSXElement {
  // Refs are assigned by SolidJS via the ref attribute
  const [styleRef, styleEl] = useRefWithUtils<HTMLStyleElement>();
  const [linkRef, linkEl] = useRefWithUtils<HTMLLinkElement>();

  //Use memo to ignore signals without changes
  const themeName = createMemo(() => getThemeIndicator().text);
  const themeColors = createMemo(() => getThemeColors());

  createEffect(() => {
    const colors = themeColors();
    console.debug("Theme controller update colors", colors);
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
    const name = themeName();
    const theme: ThemeType | undefined = themes[name as ThemeName];
    console.debug("Theme controller loading style", name);

    const hasCss = theme?.hasCss ?? false;

    if (hasCss) Loader.show();
    linkEl()?.on("load", () => {
      if (hasCss) console.debug("Theme controller loaded style", name);
      Loader.hide();
    });
    linkEl()?.on("error", (e) => {
      console.debug("Theme controller failed to load style", name, e);
      console.error(`Failed to load theme ${name}`, e);
      Notifications.add("Failed to load theme", 0);
    });
    linkEl()?.setAttribute("href", hasCss ? `/themes/${themeName()}.css` : "");
  });

  return (
    <>
      <style ref={styleRef}></style>
      <link ref={linkRef} rel="stylesheet" id="currentTheme" />
    </>
  );
}
