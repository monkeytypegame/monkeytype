import Config from "../config";
import * as JSONData from "../utils/json-data";
import * as ConfigEvent from "../observables/config-event";
import * as TTSEvent from "../observables/tts-event";

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

ConfigEvent.subscribe((eventKey, eventValue) => {
  if (eventKey === "funbox") {
    if (eventValue === "none") {
      clear();
    } else if (eventValue === "tts") {
      void init();
    }
  }
  if (eventKey === "language" && Config.funbox.split("#").includes("tts")) {
    void setLanguage();
  }
});

TTSEvent.subscribe((text) => {
  void speak(text);
});
