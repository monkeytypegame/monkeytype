import Config from "../config";
import * as ConfigEvent from "../observables/config-event";
import { getLanguage } from "../controllers/json-lists-controller";

let voice: SpeechSynthesisUtterance | undefined;

export async function setLanguage(lang = Config.language): Promise<void> {
  if (!voice) return;
  const language = await getLanguage(lang);
  const bcp = language.bcp47 ? language.bcp47 : "en-US";
  voice.lang = bcp;
}

export async function init(): Promise<void> {
  voice = new SpeechSynthesisUtterance();
  setLanguage();
}

export function clear(): void {
  voice = undefined;
}

export function speak(text: string): void {
  window.speechSynthesis.cancel();
  if (voice === undefined) init();

  if (voice !== undefined) {
    voice.text = text;
    window.speechSynthesis.speak(voice);
  }
}

ConfigEvent.subscribe((eventKey, eventValue) => {
  if (eventKey === "funbox") {
    if (eventValue === "none") {
      clear();
    } else if (eventValue === "tts") {
      init();
    }
  }
  if (eventKey === "language" && Config.funbox === "tts") setLanguage();
});
