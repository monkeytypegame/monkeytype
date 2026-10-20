import { CustomBackgroundFilter } from "@monkeytype/schemas/configs";
import { Link, Meta, MetaProvider, Style } from "@solidjs/meta";
import {
  createEffect,
  createMemo,
  createSignal,
  JSXElement,
  on,
  Show,
} from "solid-js";

import { getConfig } from "../../config/store";
import { themes } from "../../constants/themes";
import { createDebouncedEffectOn } from "../../hooks/effects";
import { useRefWithUtils } from "../../hooks/useRefWithUtils";
import { hideLoaderBar, showLoaderBar } from "../../states/loader-bar";
import { showNoticeNotification } from "../../states/notifications";
import { setErrorBorderDisabled } from "../../states/test";
import {
  getCustomBackgroundFilterPreview,
  getTheme,
  setCustomBackgroundFilterPreview,
} from "../../states/theme";
import { isColorDark } from "../../utils/colors";
import fileStorage from "../../utils/file-storage";
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
    showNoticeNotification("Failed to load theme");
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
  createEffect(() => {
    document.body.classList.toggle("darkMode", isColorDark(getTheme().bg));
  });

  return (
    <>
      <CustomBackground />
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
    </>
  );
}

function CustomBackground(): JSXElement {
  // a local background file wins over the config url
  const [url, setUrl] = createSignal("");
  let urlRequest = 0;
  createEffect(
    on(
      () =>
        [
          getConfig.customBackground,
          fileStorage.track("LocalBackgroundFile"),
        ] as const,
      ([configUrl]) => {
        const request = ++urlRequest;
        void fileStorage.getFile("LocalBackgroundFile").then((localFile) => {
          // a later change already started its own lookup
          if (request !== urlRequest) return;
          setUrl(localFile ?? configUrl);
        });
      },
    ),
  );

  createEffect(() => setErrorBorderDisabled(url() !== ""));

  createEffect(
    on(
      () => [...getConfig.customBackgroundFilter],
      () => setCustomBackgroundFilterPreview(undefined),
      { defer: true },
    ),
  );
  const filter = (): CustomBackgroundFilter =>
    getCustomBackgroundFilterPreview() ?? getConfig.customBackgroundFilter;

  const onError = (e: Event): void => {
    (e.currentTarget as HTMLImageElement).style.display = "none";
    showNoticeNotification(
      "Custom background link is either temporarily unavailable or expired. Please make sure the URL is correct or change it",
      { durationMs: 5000 },
    );
  };

  return (
    <div class="customBackground">
      {/* keyed: a new url gets a fresh img, shown again after a failed one */}
      <Show when={url() !== "" && url()} keyed>
        {(src) => (
          <img
            src={src}
            onError={onError}
            style={{
              ...backgroundFilterStyle(filter()),
              "object-fit":
                getConfig.customBackgroundSize === "max"
                  ? undefined
                  : getConfig.customBackgroundSize,
            }}
          />
        )}
      </Show>
    </div>
  );
}

function backgroundFilterStyle([
  blur,
  brightness,
  saturate,
  opacity,
]: CustomBackgroundFilter): Record<string, string> {
  let filter = "";
  if (blur !== 0) filter += `blur(${blur}rem) `;
  if (brightness !== 1) filter += `brightness(${brightness}) `;
  if (saturate !== 1) filter += `saturate(${saturate}) `;
  if (opacity !== 1) filter += `opacity(${opacity}) `;

  // blur bleeds transparent edges: grow the image past the screen
  return {
    filter,
    width: `calc(100% + ${blur * 8}rem)`,
    height: `calc(100% + ${blur * 8}rem)`,
    transform: `scale(${1 + blur / 100})`,
    top: `-${blur * 4}rem`,
    position: "absolute",
  };
}
