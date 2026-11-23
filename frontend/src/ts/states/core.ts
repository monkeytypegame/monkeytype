import { createMemo, createSignal, createRoot } from "solid-js";
import { Formatting } from "../utils/format";
import { getConfig } from "../config/store";

export const [getVersion, setVersion] = createSignal<{
  text: string;
  isNew: boolean;
}>({
  text: "",
  isNew: false,
});

export const [getGlobalOffsetTop, setGlobalOffsetTop] = createSignal(0);
// #app stays hidden until the config and auth are loaded (see boot.ts)
export const [isAppReady, setAppReady] = createSignal(false);
export const [getIsScreenshotting, setIsScreenshotting] = createSignal(false);

export const [isUserVerified, setUserVerified] = createSignal(false);

export const [getCustomTextIndicator, setCustomTextIndicator] = createSignal<
  { name: string; isLong: boolean } | undefined
>(undefined);

export const getFormatting = createRoot(() =>
  createMemo(() => {
    return new Formatting({
      alwaysShowDecimalPlaces: getConfig.alwaysShowDecimalPlaces,
      typingSpeedUnit: getConfig.typingSpeedUnit,
    });
  }),
);
