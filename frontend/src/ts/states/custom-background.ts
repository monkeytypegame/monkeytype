import { createSignal } from "solid-js";

// slider values while dragging in settings, before they are saved to the config
export const [
  getCustomBackgroundFilterPreview,
  setCustomBackgroundFilterPreview,
] = createSignal<[number, number, number, number] | null>(null);
// whether the custom background image is loaded (set by CustomBackground)
export const [isCustomBackgroundLoaded, setCustomBackgroundLoaded] =
  createSignal(false);
