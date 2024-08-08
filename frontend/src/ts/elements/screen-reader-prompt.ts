import Config from "../config";
import * as ScreenReaderPromptEvent from "../observables/screen-reader-prompt-event";

export async function initialize(): Promise<void> {
  console.debug("ScreenReaderPrompt initialized");
}

ScreenReaderPromptEvent.subscribe(handleEvent);

function handleEvent(mode: string, word: string, wordIndex: number): void {
  // No need to prompt in zen mode
  if (Config.mode === "zen") return;

  let key = word.charAt(wordIndex);

  if (key === "") key = " ";

  console.debug("ScreenReaderPrompt received event: ", mode, key);

  const promtContainer = document.querySelector("#screenReaderPrompt");
  if (promtContainer === null) {
    console.error("Could not find element #screenReaderPrompt");
    return;
  }

  const promptElement = document.createElement("p");

  if (wordIndex == 0) {
    const promptText = "type " + word + ". ";
    promptElement.appendChild(document.createTextNode(promptText));
  }

  const promptText = fmtLetterPrompt(key);

  promptElement.appendChild(document.createTextNode(promptText));
  promtContainer.innerHTML = "";
  promtContainer.appendChild(promptElement);
}

function fmtLetterPrompt(letter: string): string {
  let prompt = "";

  prompt += "press ";

  if (charMap[letter] !== undefined) {
    prompt += charMap[letter] + ". ";
  } else {
    prompt += letter + ". ";
  }

  if (phoeneticMap[letter] !== undefined) {
    prompt += phoeneticMap[letter] + ". ";
  }

  return prompt;
}

const charMap: Record<string, string> = {
  " ": "space",
};

const phoeneticMap: Record<string, string> = {
  a: "alfa",
  b: "bravo",
  c: "charlie",
  d: "delta",
  e: "echo",
  f: "foxtrot",
  g: "golf",
  h: "hotel",
  i: "india",
  j: "juliett",
  k: "kilo",
  l: "lima",
  m: "mike",
  n: "november",
  o: "oscar",
  p: "papa",
  q: "quebec",
  r: "romeo",
  s: "sierra",
  t: "tango",
  u: "uniform",
  v: "victor",
  w: "whiskey",
  x: "x-ray",
  y: "yankee",
  z: "zulu",
};
