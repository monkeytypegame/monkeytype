import { CustomTextLimitMode, CustomTextMode } from "@monkeytype/schemas/util";
import { LocalStorageWithSchema } from "../utils/local-storage-with-schema";
import { isObject } from "../utils/misc";
import { z } from "zod";
import {
  CustomTextSettings,
  CustomTextSettingsSchema,
} from "@monkeytype/schemas/results";

const CustomTextObjectSchema = z.record(
  z.string(),
  z.object({
    text: z.string(),
    progress: z.number().optional(),
    isPipeDelimiter: z.boolean().optional().default(false),
  }),
);
type CustomTextObject = z.input<typeof CustomTextObjectSchema>;

function migrateCustomText(
  value: Record<string, unknown> | unknown[],
): CustomTextObject {
  if (!isObject(value)) {
    return {};
  }
  const migrated: CustomTextObject = {};
  for (const [name, entry] of Object.entries(value)) {
    if (typeof entry === "string") {
      migrated[name] = { text: entry, isPipeDelimiter: false };
    } else if (isObject(entry) && typeof entry["text"] === "string") {
      const item: CustomTextObject[string] = {
        text: entry["text"],
        isPipeDelimiter: entry["isPipeDelimiter"] === true,
      };
      if (typeof entry["progress"] === "number") {
        item.progress = entry["progress"];
      }
      migrated[name] = item;
    }
  }
  return migrated;
}

const customTextLS = new LocalStorageWithSchema({
  key: "customText",
  schema: CustomTextObjectSchema,
  fallback: {},
  migrate: migrateCustomText,
});
const customTextLongLS = new LocalStorageWithSchema({
  key: "customTextLong",
  schema: CustomTextObjectSchema,
  fallback: {},
  migrate: migrateCustomText,
});

type CustomTextLimit = z.infer<typeof CustomTextSettingsSchema>["limit"];

const defaultCustomTextSettings: CustomTextSettings = {
  text: ["The", "quick", "brown", "fox", "jumps", "over", "the", "lazy", "dog"],
  mode: "repeat",
  limit: { value: 9, mode: "word" },
  pipeDelimiter: false,
};

const customTextSettings = new LocalStorageWithSchema({
  key: "customTextSettings",
  schema: CustomTextSettingsSchema,
  fallback: defaultCustomTextSettings,
  migrate: (oldData, _zodIssues) => {
    const fallback = structuredClone(defaultCustomTextSettings);

    if (typeof oldData !== "object" || oldData === null) {
      return fallback;
    }
    const migratedData = fallback;
    if (
      "text" in oldData &&
      z.array(z.string()).safeParse(migratedData.text).success
    ) {
      migratedData.text = oldData["text"] as string[];
    }
    return migratedData;
  },
});

export function getText(): string[] {
  return customTextSettings.get().text;
}

export function setText(txt: string[]): void {
  const currentSettings = customTextSettings.get();
  customTextSettings.set({
    ...currentSettings,
    text: txt,
    limit: { value: txt.length, mode: currentSettings.limit.mode },
  });
}

export function getMode(): CustomTextMode {
  const currentSettings = customTextSettings.get();
  return currentSettings.mode;
}

export function setMode(val: CustomTextMode): void {
  const currentSettings = customTextSettings.get();
  customTextSettings.set({
    ...currentSettings,
    mode: val,
    limit: {
      value: currentSettings.text.length,
      mode: currentSettings.limit.mode,
    },
  });
}

export function getLimit(): CustomTextLimit {
  return customTextSettings.get().limit;
}

export function getLimitValue(): number {
  return customTextSettings.get().limit.value;
}

export function getLimitMode(): CustomTextLimitMode {
  return customTextSettings.get().limit.mode;
}

export function setLimitValue(val: number): void {
  const currentSettings = customTextSettings.get();
  customTextSettings.set({
    ...currentSettings,
    limit: { value: val, mode: currentSettings.limit.mode },
  });
}

export function setLimitMode(val: CustomTextLimitMode): void {
  const currentSettings = customTextSettings.get();
  customTextSettings.set({
    ...currentSettings,
    limit: { value: currentSettings.limit.value, mode: val },
  });
}

export function getPipeDelimiter(): boolean {
  return customTextSettings.get().pipeDelimiter;
}

export function setPipeDelimiter(val: boolean): void {
  const currentSettings = customTextSettings.get();
  customTextSettings.set({
    ...currentSettings,
    pipeDelimiter: val,
  });
}

export function getData(): CustomTextSettings {
  return customTextSettings.get();
}

export function getCustomText(name: string, long = false): string[] {
  const customText = (long ? getLocalStorageLong() : getLocalStorage())[name];
  if (customText === undefined) {
    throw new Error(`Custom text ${name} not found`);
  }
  return customText.text.split(customText.isPipeDelimiter ? "|" : / +/);
}

export function getCustomTextIsPipeDelimiter(
  name: string,
  long = false,
): boolean {
  const customText = (long ? getLocalStorageLong() : getLocalStorage())[name];
  if (customText === undefined) {
    throw new Error(`Custom text ${name} not found`);
  }
  return customText.isPipeDelimiter ?? false;
}

export function setCustomText(
  name: string,
  text: string | string[],
  long = false,
  isPipeDelimiter = false,
): boolean {
  const customText = long ? getLocalStorageLong() : getLocalStorage();

  const textString =
    typeof text === "string" ? text : text.join(isPipeDelimiter ? "|" : " ");

  customText[name] = long
    ? { text: textString, progress: 0, isPipeDelimiter }
    : { text: textString, isPipeDelimiter };

  return long ? setLocalStorageLong(customText) : setLocalStorage(customText);
}

export function deleteCustomText(name: string, long: boolean): void {
  const customText = long ? getLocalStorageLong() : getLocalStorage();

  // oxlint-disable-next-line no-dynamic-delete
  delete customText[name];

  if (long) {
    setLocalStorageLong(customText);
  } else {
    setLocalStorage(customText);
  }
}

export function getCustomTextLongProgress(name: string): number {
  const customText = getLocalStorageLong()[name];
  if (customText === undefined) throw new Error("Custom text not found");

  return customText.progress ?? 0;
}

export function setCustomTextLongProgress(
  name: string,
  progress: number,
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

function getLocalStorageLong(): CustomTextObject {
  return customTextLongLS.get();
}

function setLocalStorage(data: CustomTextObject): boolean {
  return customTextLS.set(data);
}

function setLocalStorageLong(data: CustomTextObject): boolean {
  return customTextLongLS.set(data);
}

export function getCustomTextNames(long = false): string[] {
  if (long) {
    return Object.keys(getLocalStorageLong());
  } else {
    return Object.keys(getLocalStorage());
  }
}
