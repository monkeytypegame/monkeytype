import { getConfig } from "../config/store";
import * as JSONData from "../utils/json-data";
import { createEffectOn } from "../hooks/effects";
import { createRoot } from "solid-js";

let voice: SpeechSynthesisUtterance | undefined;

export async function setLanguage(lang = getConfig.language): Promise<void> {
  if (!voice) return;
  const language = await JSONData.getLanguage(lang);
  const bcp = language.bcp47 ?? "en-US";
  voice.lang = bcp;
}

export async function init(): Promise<void> {
  voice = new SpeechSynthesisUtterance();
  await setLanguage();
}

export function clear(): void {
  voice = undefined;
}

export async function speak(text: string): Promise<void> {
  window.speechSynthesis.cancel();
  if (voice === undefined) await init();

  if (voice !== undefined) {
    voice.text = text;
    window.speechSynthesis.speak(voice);
  }
}

// a root so the effects are owned, they live as long as the page
createRoot(() => {
  createEffectOn(
    // serialized, so changes inside the funbox array count
    () => JSON.stringify(getConfig.funbox),
    () => {
      if (getConfig.funbox.includes("tts")) {
        void init();
      } else {
        clear();
      }
    },
    { defer: true },
  );
  createEffectOn(
    () => getConfig.language,
    () => {
      if (getConfig.funbox.includes("tts")) void setLanguage();
    },
    { defer: true },
  );
});
