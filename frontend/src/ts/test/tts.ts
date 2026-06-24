import { Config } from "../config/store";
import * as JSONData from "../utils/json-data";
import { configEvent } from "../events/config";
import { ttsEvent } from "../events/tts";

let voice: SpeechSynthesisUtterance | undefined;

export async function setLanguage(lang = Config.language): Promise<void> {
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

configEvent.subscribe(({ key, newValue }) => {
  if (key === "funbox") {
    if (newValue.includes("tts")) {
      void init();
    } else {
      clear();
    }
  }
  if (key === "language" && Config.funbox.includes("tts")) {
    void setLanguage();
  }
});

ttsEvent.subscribe((text) => {
  void speak(text);
});
