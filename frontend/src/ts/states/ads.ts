import { createSignal } from "solid-js";

// undefined until the ad controller checks
export const [getAdBlock, setAdBlock] = createSignal<boolean | undefined>();
export const [getCookieBlocker, setCookieBlocker] = createSignal<
  boolean | undefined
>();
