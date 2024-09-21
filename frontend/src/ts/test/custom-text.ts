import {
  CustomTextLimitMode,
  CustomTextLimitModeSchema,
  CustomTextMode,
  CustomTextModeSchema,
} from "@monkeytype/contracts/schemas/util";
import { LocalStorageWithSchema } from "../utils/local-storage-with-schema";
import { z } from "zod";
import { CustomTextDataWithTextLen } from "@monkeytype/contracts/schemas/results";

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

const CustomTextSettingsSchema = z.object({
  text: z.array(z.string()),
  mode: CustomTextModeSchema,
  limit: z.object({ value: z.number(), mode: CustomTextLimitModeSchema }),
  pipeDelimiter: z.boolean(),
});

type CustomTextSettings = z.infer<typeof CustomTextSettingsSchema>;

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
  migrate: (oldData, _zodIssues, fallback) => {
    if (typeof oldData !== "object" || oldData === null) {
      return fallback;
    }
    const migratedData = fallback;
    if (
      "text" in oldData &&
      z.array(z.string()).safeParse(migratedData.text).success
    ) {
      migratedData.text = oldData.text as string[];
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
  return customTextSettings.get().limit as CustomTextLimit;
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

export type CustomTextData = Omit<CustomTextDataWithTextLen, "textLen"> & {
  text: string[];
};

export function getData(): CustomTextData {
  return {
    text: getText(),
    mode: getMode(),
    limit: getLimit(),
    pipeDelimiter: getPipeDelimiter(),
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
