import type { Howl } from "howler";
import { Config } from "../config/store";

let howlerModulePromise: Promise<typeof import("howler")> | null = null;
export async function getHowlerModule(): Promise<typeof import("howler")> {
  howlerModulePromise ??= import("howler");
  return howlerModulePromise;
}

const howlers: Record<string, Promise<Howl>> = {};

export async function getHowl(src: string): Promise<Howl> {
  howlers[src] ??= (async () => {
    const { Howl } = await getHowlerModule();
    return new Howl({ src });
  })();

  return howlers[src];
}

export function playFromStart(howl: Howl): void {
  howl.stop();
  howl.seek(0);
  howl.play();
}

let initPromise: Promise<void> | null = null;

export async function initHowlerVolume(): Promise<void> {
  initPromise ??= (async () => {
    const { Howler } = await getHowlerModule();
    Howler.volume(Config.soundVolume);
  })();

  await initPromise;
}

export async function setVolume(val: number): Promise<void> {
  try {
    const { Howler } = await getHowlerModule();
    Howler.volume(val);
  } catch (e) {
    //
  }
}

export async function clearAllSounds(): Promise<void> {
  const { Howler } = await getHowlerModule();
  Howler.stop();
}
