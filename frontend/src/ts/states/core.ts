import { createSignal } from "solid-js";

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
