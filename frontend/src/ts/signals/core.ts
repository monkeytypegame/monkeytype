import { createSignal } from "solid-js";
import { PageName } from "../pages/page";

export const [getActivePage, setActivePage] = createSignal<PageName>("loading");
export const [getVersion, setVersion] = createSignal<{
  text: string;
  isNew: boolean;
}>({
  text: "",
  isNew: false,
});

export const [getThemeIndicator, setThemeIndicator] = createSignal<{
  /**
   * human readable display name, this is not the ThemeName.
   * e.g. the display is `serika dark` for the ThemeName `serika_dark`
   */
  text: string;
  isFavorite: boolean;
}>({
  text: "serika dark",
  isFavorite: false,
});

export const [getCommandlineSubgroup, setCommandlineSubgroup] = createSignal<
  "ads" | null
>(null);

export const [getFocus, setFocus] = createSignal(false);
export const [getGlobalOffsetTop, setGlobalOffsetTop] = createSignal(0);
export const [getIsScreenshotting, setIsScreenshotting] = createSignal(false);

export const [getUserId, setUserId] = createSignal<string | null>(null);
export const isLoggedIn = () => getUserId() !== null;
