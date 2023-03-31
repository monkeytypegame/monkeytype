export let text = [
  "The",
  "quick",
  "brown",
  "fox",
  "jumps",
  "over",
  "the",
  "lazy",
  "dog",
];
export let isWordRandom = false;
export let isTimeRandom = false;
export let word = -1;
export let time = -1;
export let delimiter = " ";
export let popupTextareaState = "The quick brown fox jumps over the lazy dog";

export function setPopupTextareaState(value: string): void {
  popupTextareaState = value;
}

export function setText(txt: string[]): void {
  text = txt;
}

export function getText(): string {
  return text.join(" ");
}

export function getTextArray(): string[] {
  return text;
}

export function setIsWordRandom(val: boolean): void {
  isWordRandom = val;
}

export function setIsTimeRandom(val: boolean): void {
  isTimeRandom = val;
}

export function setTime(val: number): void {
  time = val;
}

export function setWord(val: number): void {
  word = val;
}

export function setDelimiter(val: string): void {
  delimiter = val;
}

type CustomTextObject = Record<string, string>;

type CustomTextLongObject = Record<string, { text: string; progress: number }>;

export function getCustomText(name: string, long = false): string[] {
  if (long) {
    return getCustomTextLongObject()[name]["text"].split(/ +/);
  } else {
    return getCustomTextObject()[name].split(/ +/);
  }
}

export function setCustomText(
  name: string,
  text: string | string[],
  long = false
): void {
  if (long) {
    const customText = getCustomTextLongObject();

    customText[name] = {
      text: "",
      progress: 0,
    };

    if (typeof text === "string") {
      customText[name]["text"] = text;
    } else {
      customText[name]["text"] = text.join(" ");
    }

    window.localStorage.setItem("customTextLong", JSON.stringify(customText));
  } else {
    const customText = getCustomTextObject();

    if (typeof text === "string") {
      customText[name] = text;
    } else {
      customText[name] = text.join(" ");
    }

    window.localStorage.setItem("customText", JSON.stringify(customText));
  }
}

export function deleteCustomText(name: string, long = false): void {
  const customText = long ? getCustomTextLongObject() : getCustomTextObject();

  if (customText[name]) delete customText[name];

  if (long) {
    window.localStorage.setItem("customTextLong", JSON.stringify(customText));
  } else {
    window.localStorage.setItem("customText", JSON.stringify(customText));
  }
}

export function getCustomTextLongProgress(name: string): number {
  const customText = getCustomTextLongObject();

  return customText[name]["progress"] ?? 0;
}

export function setCustomTextLongProgress(
  name: string,
  progress: number
): void {
  const customTextProgress = getCustomTextLongObject();

  customTextProgress[name]["progress"] = progress;

  window.localStorage.setItem(
    "customTextLong",
    JSON.stringify(customTextProgress)
  );
}

function getCustomTextObject(): CustomTextObject {
  return JSON.parse(window.localStorage.getItem("customText") ?? "{}");
}

function getCustomTextLongObject(): CustomTextLongObject {
  return JSON.parse(window.localStorage.getItem("customTextLong") ?? "{}");
}

export function getCustomTextNames(long = false): string[] {
  if (long) {
    return Object.keys(getCustomTextLongObject());
  } else {
    return Object.keys(getCustomTextObject());
  }
}
