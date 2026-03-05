import { JSXElement, Show } from "solid-js";

import * as Commandline from "../../../commandline/commandline";
import Config, { setConfig } from "../../../config";
import * as Notifications from "../../../elements/notifications";
import { isAuthenticated } from "../../../firebase";
import { getThemeIndicator } from "../../../signals/core";
import { getSnapshot } from "../../../stores/snapshot";
import { Fa } from "../../common/Fa";

export function ThemeIndicator(): JSXElement {
  const handleClick = (e: MouseEvent): void => {
    if (e.shiftKey) {
      if (Config.customTheme) {
        setConfig("customTheme", false);
        return;
      }
      if (isAuthenticated() && (getSnapshot()?.customThemes?.length ?? 0) < 1) {
        Notifications.add("No custom themes!", 0);
        setConfig("customTheme", false);
        return;
      }
      setConfig("customTheme", true);
    } else {
      const subgroup = Config.customTheme ? "customTheme" : "themes";
      Commandline.show({
        subgroupOverride: subgroup,
      });
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
