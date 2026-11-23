import { ThemeName } from "@monkeytype/schemas/configs";
import { createMemo, JSXElement, Show } from "solid-js";

import { isAuthenticated } from "../../../auth/state";
import { setConfig } from "../../../config/setters";
import { getConfig } from "../../../config/store";
import { getCustomThemes } from "../../../queries/custom-themes";
import { showCommandline } from "../../../states/commandline";
import { showNoticeNotification } from "../../../states/notifications";
import { getRandomTheme, getThemePreview } from "../../../theme/state";
import { areSortedArraysEqual } from "../../../utils/arrays";
import { Fa } from "../../common/Fa";

export function ThemeIndicator(): JSXElement {
  const indicator = createMemo(() => {
    const preview = getThemePreview()?.name;
    const random = getRandomTheme()?.name;

    let text: string = random ?? getConfig.theme;

    if (getConfig.customTheme && preview === undefined) {
      // Match current custom theme by colors since Config does not store custom theme IDs
      const matchedTheme = getCustomThemes().find((ct) =>
        areSortedArraysEqual(ct.colors, getConfig.customThemeColors),
      );
      text = matchedTheme ? `${matchedTheme.name} (custom)` : "custom";
    }

    if (preview !== undefined) text = preview;

    const current = preview ?? random ?? getConfig.theme;
    const isFavorite =
      !getConfig.customTheme &&
      getConfig.favThemes.includes(current as ThemeName);

    // display name: `serika dark` for the ThemeName `serika_dark`
    return { text: text.replace(/_/g, " "), isFavorite };
  });

  const handleClick = (e: MouseEvent): void => {
    if (e.shiftKey) {
      if (getConfig.customTheme) {
        setConfig("customTheme", false);
        return;
      }
      if (isAuthenticated() && getCustomThemes().length < 1) {
        showNoticeNotification("No custom themes!");
        return;
      }
      setConfig("customTheme", true);
    } else {
      const subgroup = getConfig.customTheme ? "customTheme" : "themes";
      showCommandline({ subgroupOverride: subgroup });
    }
  };

  return (
    <button
      type="button"
      class="textButton"
      aria-label="Shift-click to toggle custom theme"
      data-balloon-pos="left"
      onClick={handleClick}
    >
      <div class="relative">
        <Show when={indicator().isFavorite}>
          <div class="absolute top-[-0.5em] right-[-0.5em] flex rounded-full bg-bg p-[0.25em]">
            <Fa icon="fa-star" size={0.5} />
          </div>
        </Show>
        <Fa icon="fa-palette" fixedWidth />
      </div>
      <div class="text">{indicator().text}</div>
    </button>
  );
}
