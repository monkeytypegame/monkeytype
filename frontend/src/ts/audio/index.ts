import { createRoot } from "solid-js";
import { getConfig } from "../config/store";
import { createEffectOn } from "../hooks/effects";
import { preloadSounds } from "./click";
import { setVolume } from "./howler";

export { playClick, previewClick } from "./click";
export { playError, previewError } from "./error";
export { playFartReverb, playTimeWarning } from "./other";
export { clearAllSounds } from "./howler";

// a root so the effects are owned, they live as long as the page
createRoot(() => {
  createEffectOn(
    () => getConfig.playSoundOnClick,
    (value) => {
      if (value !== "off") void preloadSounds();
    },
    { defer: true },
  );
  createEffectOn(
    () => getConfig.soundVolume,
    (value) => void setVolume(value),
    { defer: true },
  );
});
