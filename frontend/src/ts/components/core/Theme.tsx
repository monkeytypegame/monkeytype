import { Link, Meta, MetaProvider, Style } from "@solidjs/meta";
import { createEffect, createMemo, JSXElement } from "solid-js";

import { themes } from "../../constants/themes";
import * as Notifications from "../../elements/notifications";
import { createDebouncedEffectOn } from "../../hooks/effects";
import { useRefWithUtils } from "../../hooks/useRefWithUtils";
import { hideLoaderBar, showLoaderBar } from "../../signals/loader-bar";
import { getTheme } from "../../signals/theme";
import { FavIcon } from "./FavIcon";

export function Theme(): JSXElement {
  // Refs are assigned by SolidJS via the ref attribute
  const [styleRef, styleEl] = useRefWithUtils<HTMLStyleElement>();
  const [linkRef, linkEl] = useRefWithUtils<HTMLLinkElement>();

  //Use memo to ignore signals without changes, needed for the css loading
  const getThemeName = createMemo(() => getTheme().name);

  const onLoad = (e: Event): void => {
    hideLoaderBar();
    const target = e.target as HTMLLinkElement;
    if (target.href !== "") {
      console.debug(
        `Theme component loaded style for theme ${target.dataset["name"]}`,
      );
    }
  };

  const onError = (e: Event): void => {
    hideLoaderBar();
    const target = e.target as HTMLLinkElement;
    const name = target.dataset["name"];
    console.debug("Theme component failed to load style", name, e);
    console.error(`Failed to load theme ${name}`, e);
    Notifications.add("Failed to load theme", 0);
  };

  createDebouncedEffectOn(125, getTheme, (colors) => {
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
}`);
  });

  createEffect(() => {
    const name = getThemeName();
    const hasCss = name !== "custom" && (themes[name].hasCss ?? false);
    console.debug(
      `Theme component ${hasCss ? "loading style" : "removing style"} for theme ${name}`,
    );
    if (hasCss) showLoaderBar();
    linkEl()?.setAttribute("href", hasCss ? `/themes/${name}.css` : "");
  });

  return (
    <MetaProvider>
      <Style id="theme" ref={styleRef} />
      <Link
        ref={linkRef}
        rel="stylesheet"
        id="currentTheme"
        data-name={getTheme().name}
        onError={onError}
        onLoad={onLoad}
      />
      <Meta id="metaThemeColor" name="theme-color" content={getTheme().bg} />
      <FavIcon theme={getTheme()} />
    </MetaProvider>
  );
}
