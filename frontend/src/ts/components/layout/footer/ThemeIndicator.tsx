import { JSXElement, Show } from "solid-js";
import { getThemeIndicator } from "../../../signals/core";
import Config, { setConfig } from "../../../config";
import { isAuthenticated } from "../../../firebase";
import * as DB from "../../../db";
import * as Notifications from "../../../elements/notifications";
import * as Commandline from "../../../commandline/commandline";

export function ThemeIndicator(): JSXElement {
  const handleClick = (e: MouseEvent): void => {
    if (e.shiftKey) {
      if (Config.customTheme) {
        setConfig("customTheme", false);
        return;
      }
      if (
        isAuthenticated() &&
        (DB.getSnapshot()?.customThemes?.length ?? 0) < 1
      ) {
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
          <i class="fas fa-star absolute top-[-0.5em] right-[-0.5em] rounded-full bg-bg p-[0.25em] text-[0.5em]"></i>
        </Show>
        <i class="fas fa-fw fa-palette"></i>
      </div>
      <div class="text">{getThemeIndicator().text}</div>
    </button>
  );
}
