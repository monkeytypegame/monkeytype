import { JSXElement, Show } from "solid-js";

import { setConfig } from "../../../config/setters";
import { Config } from "../../../config/store";
import {
  getThemeIndicator,
  isAuthenticated,
  setCommandlineSubgroup,
} from "../../../states/core";
import { showModal } from "../../../states/modals";
import { showNoticeNotification } from "../../../states/notifications";
import { getSnapshot } from "../../../states/snapshot";
import { Fa } from "../../common/Fa";

export function ThemeIndicator(): JSXElement {
  const handleClick = (e: MouseEvent): void => {
    if (e.shiftKey) {
      if (Config.customTheme) {
        setConfig("customTheme", false);
        return;
      }
      if (isAuthenticated() && (getSnapshot()?.customThemes?.length ?? 0) < 1) {
        showNoticeNotification("No custom themes!");
        setConfig("customTheme", false);
        return;
      }
      setConfig("customTheme", true);
    } else {
      const subgroup = Config.customTheme ? "customTheme" : "themes";
      setCommandlineSubgroup(subgroup);
      showModal("Commandline");
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
        <Show when={getThemeIndicator().isFavorite}>
          <div class="absolute top-[-0.5em] right-[-0.5em] flex rounded-full bg-bg p-[0.25em]">
            <Fa icon="fa-star" size={0.5} />
          </div>
        </Show>
        <Fa icon="fa-palette" fixedWidth />
      </div>
      <div class="text">{getThemeIndicator().text}</div>
    </button>
  );
}
