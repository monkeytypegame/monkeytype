import {
  CustomTextLimitMode,
  CustomTextMode,
} from "@monkeytype/contracts/schemas/util";
import { LocalStorageWithSchema } from "../utils/local-storage-with-schema";
import { z } from "zod";

//zod schema for an object with string keys and string values
const CustomTextObjectSchema = z.record(z.string(), z.string());
type CustomTextObject = z.infer<typeof CustomTextObjectSchema>;

const CustomTextLongObjectSchema = z.record(
  z.string(),
  z.object({ text: z.string(), progress: z.number() })
);
type CustomTextLongObject = z.infer<typeof CustomTextLongObjectSchema>;

const customTextLS = new LocalStorageWithSchema({
  key: "customText",
  schema: CustomTextObjectSchema,
  fallback: {},
});
//todo maybe add migrations here?
const customTextLongLS = new LocalStorageWithSchema({
  key: "customTextLong",
  schema: CustomTextLongObjectSchema,
  fallback: {},
});

// function setLocalStorage(data: CustomTextObject): void {
//   window.localStorage.setItem("customText", JSON.stringify(data));
// }

// function setLocalStorageLong(data: CustomTextLongObject): void {

let text: string[] = [
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

let mode: CustomTextMode = "repeat";
const limit: MonkeyTypes.CustomTextLimit = {
  value: 9,
  mode: "word",
};
let pipeDelimiter = false;

export function getText(): string[] {
  return text;
}

export function setText(txt: string[]): void {
  text = txt;
  limit.value = text.length;
}

export function getMode(): CustomTextMode {
  return mode;
}

export function setMode(val: CustomTextMode): void {
  mode = val;
  limit.value = text.length;
}

export function getLimit(): MonkeyTypes.CustomTextLimit {
  return limit;
}

export function getLimitValue(): number {
  return limit.value;
}

export function getLimitMode(): CustomTextLimitMode {
  return limit.mode;
}

export function setLimitValue(val: number): void {
  limit.value = val;
}

export function setLimitMode(val: CustomTextLimitMode): void {
  limit.mode = val;
}

export function getPipeDelimiter(): boolean {
  return pipeDelimiter;
}

export function setPipeDelimiter(val: boolean): void {
  pipeDelimiter = val;
}

export function getData(): MonkeyTypes.CustomTextData {
  return {
    text,
    mode,
    limit,
    pipeDelimiter,
  };
}

export function getCustomText(name: string, long = false): string[] {
  if (long) {
    const customTextLong = getLocalStorageLong();
    const customText = customTextLong[name];
    if (customText === undefined)
      throw new Error(`Custom text ${name} not found`);
    return customText.text.split(/ +/);
  } else {
    const customText = getLocalStorage()[name];
    if (customText === undefined)
      throw new Error(`Custom text ${name} not found`);
    return customText.split(/ +/);
  }
}

export function setCustomText(
  name: string,
  text: string | string[],
  long = false
): void {
  if (long) {
    const customText = getLocalStorageLong();

    customText[name] = {
      text: "",
      progress: 0,
    };

    const textByName = customText[name];
    if (textByName === undefined) {
      throw new Error("Custom text not found");
    }

    if (typeof text === "string") {
      textByName.text = text;
    } else {
      textByName.text = text.join(" ");
    }

    setLocalStorageLong(customText);
  } else {
    const customText = getLocalStorage();

    if (typeof text === "string") {
      customText[name] = text;
    } else {
      customText[name] = text.join(" ");
    }

    setLocalStorage(customText);
  }
}

export function deleteCustomText(name: string, long: boolean): void {
  const customText = long ? getLocalStorageLong() : getLocalStorage();

  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
  delete customText[name];

  if (long) {
    setLocalStorageLong(customText as CustomTextLongObject);
  } else {
    setLocalStorage(customText as CustomTextObject);
  }
}

export function getCustomTextLongProgress(name: string): number {
  const customText = getLocalStorageLong()[name];
  if (customText === undefined) throw new Error("Custom text not found");

  return customText.progress ?? 0;
}

export function setCustomTextLongProgress(
  name: string,
  progress: number
): void {
  const customTexts = getLocalStorageLong();
  const customText = customTexts[name];
  if (customText === undefined) throw new Error("Custom text not found");

  customText.progress = progress;
  setLocalStorageLong(customTexts);
}

function getLocalStorage(): CustomTextObject {
  return customTextLS.get();
}

function getLocalStorageLong(): CustomTextLongObject {
  return customTextLongLS.get();
}

function setLocalStorage(data: CustomTextObject): void {
  customTextLS.set(data);
}

function setLocalStorageLong(data: CustomTextLongObject): void {
  customTextLongLS.set(data);
}

export function getCustomTextNames(long = false): string[] {
  if (long) {
    return Object.keys(getLocalStorageLong());
  } else {
    return Object.keys(getLocalStorage());
  }
}
