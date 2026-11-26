import { Link, Meta, MetaProvider, Style } from "@solidjs/meta";
import { createEffect, createMemo, JSXElement, Show } from "solid-js";

import { Theme as ThemeColors, themes } from "../../constants/themes";
import { createDebouncedEffectOn } from "../../hooks/effects";
import { useBodyClasses } from "../../hooks/useBodyClasses";
import { useRefWithUtils } from "../../hooks/useRefWithUtils";
import { hideLoaderBar, showLoaderBar } from "../../states/loader-bar";
import { showNoticeNotification } from "../../states/notifications";
import { getConfiguredTheme, getTheme } from "../../theme/state";
import { isColorDark } from "../../utils/colors";
import { FavIcon } from "./FavIcon";

/** The `:root` color variables for `theme`. */
function getThemeColorsCss(theme: ThemeColors): string {
  return `
:root {
    --bg-color: ${theme.bg};
    --main-color: ${theme.main};
    --caret-color: ${theme.caret};
    --sub-color: ${theme.sub};
    --sub-alt-color: ${theme.subAlt};
    --text-color: ${theme.text};
    --error-color: ${theme.error};
    --error-extra-color: ${theme.errorExtra};
    --colorful-error-color: ${theme.colorfulError};
    --colorful-error-extra-color: ${theme.colorfulErrorExtra};
}`;
}

/**
 * Stores the configured theme's colors for the inline script in index.html,
 * which applies them before the first paint to avoid an initial flash of the
 * default theme. Not for previews.
 */
function cacheThemeColors(theme: ThemeColors): void {
  localStorage.setItem("firstPaintThemeCss", getThemeColorsCss(theme));
}

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
    showNoticeNotification("Failed to load theme");
  };

  createDebouncedEffectOn(125, getTheme, (colors) => {
    styleEl()?.setHtml(getThemeColorsCss(colors));
  });

  // the configured theme only: random themes and previews aren't cached
  createEffect(() => cacheThemeColors(getConfiguredTheme()));

  const isThemeWithCss = () => {
    const name = getThemeName();
    return name !== "custom" && (themes[name]?.hasCss ?? false);
  };

  createEffect(() => {
    const name = getThemeName();
    const hasCss = isThemeWithCss();

    console.debug(
      `Theme component ${hasCss ? "loading style" : "removing style"} for theme ${name}`,
    );
    if (hasCss) {
      showLoaderBar();
    } else {
      hideLoaderBar();
    }
    linkEl()?.setAttribute("href", hasCss ? `/themes/${name}.css` : "");
  });

  // tailwind's dark: variant
  useBodyClasses(() => ({ darkMode: isColorDark(getTheme().bg) }));

  return (
    <MetaProvider>
      <Style id="theme" ref={styleRef} />
      <Show when={isThemeWithCss()}>
        <Link
          ref={linkRef}
          rel="stylesheet"
          id="currentTheme"
          data-name={getTheme().name}
          onError={onError}
          onLoad={onLoad}
        />
      </Show>
      <Meta id="metaThemeColor" name="theme-color" content={getTheme().bg} />
      <FavIcon theme={getTheme()} />
    </MetaProvider>
  );
}
