import { createEffect, createMemo, JSXElement } from "solid-js";
import { getTheme } from "../../signals/theme";
import { useRefWithUtils } from "../../hooks/useRefWithUtils";
import { getThemeIndicator } from "../../signals/core";
import { themes, Theme as ThemeType } from "../../constants/themes";
import { ThemeName } from "@monkeytype/schemas/configs";
import * as Loader from "../../elements/loader";
import * as Notifications from "../../elements/notifications";
import { Link, Meta, MetaProvider, Style } from "@solidjs/meta";
import { FavIcon } from "./FavIcon";

export function Theme(): JSXElement {
  // Refs are assigned by SolidJS via the ref attribute
  const [styleRef, styleEl] = useRefWithUtils<HTMLStyleElement>();
  const [linkRef, linkEl] = useRefWithUtils<HTMLLinkElement>();

  const onLoad = (e: Event): void => {
    const target = e.target as HTMLLinkElement;
    if (target.href !== "") {
      console.debug(
        `Theme controller loaded style for theme ${target.dataset["name"]}`,
      );
    }
    Loader.hide();
  };

  const onError = (e: Event): void => {
    const target = e.target as HTMLLinkElement;
    const name = target.dataset["name"];
    console.debug("Theme controller failed to load style", name, e);
    console.error(`Failed to load theme ${name}`, e);
    Notifications.add("Failed to load theme", 0);
  };

  //Use memo to ignore signals without changes
  const themeName = createMemo(() => getThemeIndicator().text);

  createEffect(() => {
    const colors = getTheme();
    styleEl()?.setHtml(`
:root {

    --bg-color: ${colors.bg};
    --main-color: ${colors.main};
    --caret-color: ${colors.caret};
    --sub-color: ${colors.sub};
    --sub-alt-color: ${colors.subAlt};
    --text-color: ${colors.text};
    --error-color: ${colors.error};
    --error-extra-color: ${colors.errorExtra};
    --colorful-error-color: ${colors.colorfulError};
    --colorful-error-extra-color: ${colors.colorfulErrorExtra};
}
    `);
  });

  createEffect(() => {
    const themeKey = themeName().replace(/ /g, "_");

    //theme name can be custom, we won't find a theme for it
    const theme: ThemeType | undefined = themes[themeKey as ThemeName];
    const hasCss = theme?.hasCss ?? false;

    console.debug(
      `Theme controller ${hasCss ? "loading style" : "removing style"} for theme ${themeKey}`,
    );

    if (hasCss) Loader.show();
    linkEl()?.setAttribute("href", hasCss ? `/themes/${themeKey}.css` : "");
  });

  return (
    <MetaProvider>
      <Style id="theme" ref={styleRef} />
      <Link
        ref={linkRef}
        rel="stylesheet"
        id="currentTheme"
        data-name={themeName()}
        onError={onError}
        onLoad={onLoad}
      />
      <Meta
        id="metaThemeColor"
        name="theme-color"
        content="getThemeColors().bg"
      />
      <FavIcon theme={getTheme()} />
    </MetaProvider>
  );
}
