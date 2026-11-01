import { createEffect, createResource, JSXElement, Show } from "solid-js";

import { getConfig } from "../../config/store";
import { getFontPreview } from "../../states/font";
import fileStorage from "../../utils/file-storage";
import { getLanguage } from "../../utils/json-data";
import { replaceUnderscoresWithSpaces } from "../../utils/strings";

const LOCAL_FONT_NAME = "LOCALCUSTOM";

/** Sets `--font` from the config, the commandline preview or the uploaded local font. */
export function Font(): JSXElement {
  const [localFont] = createResource(
    () => fileStorage.track("LocalFontFamilyFile"),
    async () => fileStorage.getFile("LocalFontFamilyFile"),
  );
  const [language] = createResource(() => getConfig.language, getLanguage);

  createEffect(() => {
    // the preview wins over the local font, which wins over the config
    const font =
      getFontPreview() ??
      (localFont() !== undefined ? LOCAL_FONT_NAME : getConfig.fontFamily);
    const preferred = language()?.preferredFont;

    const fonts = [
      `"${replaceUnderscoresWithSpaces(font)}"`,
      preferred !== undefined
        ? `"${replaceUnderscoresWithSpaces(preferred)}"`
        : undefined,
      '"Roboto Mono"',
      '"Vazirharf"',
      "monospace",
    ].filter((it) => it !== undefined);

    document.documentElement.style.setProperty("--font", fonts.join(","));
  });

  return (
    <Show when={localFont()}>
      {(url) => (
        <style>{`
          @font-face {
            font-family: ${LOCAL_FONT_NAME};
            src: url(${url()});
            font-weight: 400;
            font-style: normal;
            font-display: block;
          }`}</style>
      )}
    </Show>
  );
}
