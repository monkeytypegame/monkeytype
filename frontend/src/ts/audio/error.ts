import type { Howl } from "howler";
import { PlaySoundOnError } from "@monkeytype/schemas/configs";
import { Config } from "../config/store";
import { randomElementFromArray } from "../utils/arrays";
import { getHowl, getHowlerModule, playFromStart } from "./howler";

type ErrorSounds = Record<Exclude<PlaySoundOnError, "off">, Howl[]>;

let errorSounds: ErrorSounds | null = null;

export async function initErrorSounds(): Promise<ErrorSounds> {
  if (errorSounds !== null) return errorSounds;
  errorSounds = {
    1: [await getHowl("../sounds/error1/1.wav")],
    2: [await getHowl("../sounds/error2/1.wav")],
    3: [await getHowl("../sounds/error3/1.wav")],
    4: [
      await getHowl("../sounds/error4/1.wav"),
      await getHowl("../sounds/error4/2.wav"),
    ],
  };
  (await getHowlerModule()).Howler.volume(Config.soundVolume);
  return errorSounds;
}

export async function previewError(val: PlaySoundOnError): Promise<void> {
  if (val === "off") return;
  const sounds = await initErrorSounds();

  const sound = sounds[val]?.[0];
  if (sound === undefined) return;
  playFromStart(sound);
}

export async function playError(): Promise<void> {
  if (Config.playSoundOnError === "off") return;
  const sounds = (await initErrorSounds())[Config.playSoundOnError];
  if (sounds === undefined) throw new Error("Invalid error sound ID");

  const randomSound = randomElementFromArray(sounds);
  randomSound.seek(0);
  randomSound.play();
}
