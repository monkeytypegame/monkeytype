import { getHowl, playFromStart } from "./howler";

export async function playTimeWarning(): Promise<void> {
  playFromStart(await getHowl("../sounds/timeWarning.wav"));
}

export async function playFartReverb(): Promise<void> {
  playFromStart(await getHowl("../sounds/fart-reverb.wav"));
}
