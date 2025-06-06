import {
  CustomTextLimitMode,
  CustomTextMode,
} from "@monkeytype/contracts/schemas/util";
import { LocalStorageWithSchema } from "../utils/local-storage-with-schema";
import { z } from "zod";
import { CompletedEventCustomTextSchema } from "@monkeytype/contracts/schemas/results";
import { deepClone } from "../utils/misc";
import { DBSchema, IDBPDatabase, openDB } from "idb";

export const CustomTextSettingsSchema = CompletedEventCustomTextSchema.omit({
  textLen: true,
}).extend({
  text: z.array(z.string()).min(1),
});

export type CustomTextSettings = z.infer<typeof CustomTextSettingsSchema>;

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
    const fallback = deepClone(defaultCustomTextSettings);

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
type CustomTextDB = DBSchema & {
  customTexts: {
    key: string;
    value: {
      text: string;
    };
  };
  customLongTexts: {
    key: string;
    value: {
      text: string;
      progress: number;
    };
  };
};

export async function getDB(): Promise<IDBPDatabase<CustomTextDB>> {
  return await openDB<CustomTextDB>("customTexts", 1, {
    async upgrade(db, oldVersion, _newVersion, tx, _event) {
      if (oldVersion === 0) {
        console.debug("Initialize indexedDB for customTexts from localStorage");

        //Legacy storage
        const CustomTextObjectSchema = z.record(z.string(), z.string());
        const CustomTextLongObjectSchema = z.record(
          z.string(),
          z.object({ text: z.string(), progress: z.number() })
        );
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

        //create objectStores
        await db.createObjectStore("customTexts");
        await db.createObjectStore("customLongTexts");
        //await db.createObjectStore("currentSettings");

        const ctStore = tx.objectStore("customTexts");
        const longCtStore = tx.objectStore("customLongTexts");
        //const currentSettingsStore = tx.objectStore("currentSettings");

        //copy from old localStorage
        await Promise.all([
          ...Object.entries(customTextLS.get()).map(async ([key, value]) =>
            ctStore.add({ text: value }, key)
          ),
          ...Object.entries(customTextLongLS.get()).map(async ([key, value]) =>
            longCtStore.add({ text: value.text, progress: value.progress }, key)
          ),
          /*          currentSettingsStore.put(
            customTextSettings.get(),
            "_currentSettings_"
          ),*/
          tx.done,
        ]);

        console.debug("Remove localStorage after migration");
        //TODO:
        //customTextLS.destroy();
        //customTextLongLS.destroy();
        //customTextSettings.destroy();
      }
    },
  });
}

window.globalThis["db"] = {
  get: getDB,
  getText: getCustomText,
  setText: setCustomText,
};

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

export function getData(): CustomTextSettings {
  return customTextSettings.get();
}

export async function getCustomText(
  name: string,
  long = false
): Promise<string[]> {
  const db = await getDB();
  const customText = await db.get(
    long ? "customLongTexts" : "customTexts",
    name
  );
  if (customText === undefined)
    throw new Error(`Custom text ${name} not found`);

  return customText.text.split(/ +/);
}

export async function setCustomText(
  name: string,
  text: string | string[],
  long = false
): Promise<boolean> {
  const db = await getDB();
  const textToStore = typeof text === "string" ? text : text.join(" ");
  try {
    if (long) {
      await db.put("customLongTexts", { text: textToStore, progress: 0 }, name);
    } else {
      await db.put("customTexts", { text: textToStore }, name);
    }
    return true;
  } catch (e) {
    console.debug("Storing to indexedDb failed: ", e);
    return false;
  }
}

export async function deleteCustomText(
  name: string,
  long: boolean
): Promise<void> {
  const db = await getDB();

  await db.delete(long ? "customLongTexts" : "customTexts", name);
}

export async function getCustomTextLongProgress(name: string): Promise<number> {
  const db = await getDB();
  const customText = await db.get("customLongTexts", name);
  if (customText === undefined) throw new Error("Custom text not found");

  return customText.progress ?? 0;
}

export async function setCustomTextLongProgress(
  name: string,
  progress: number
): Promise<void> {
  const db = await getDB();
  const customText = await db.get("customLongTexts", name);
  if (customText === undefined) throw new Error("Custom text not found");

  customText.progress = progress;
  await db.put("customLongTexts", customText, name);
}

export async function getCustomTextNames(long = false): Promise<string[]> {
  const db = getDB();

  return (await db).getAllKeys(long ? "customLongTexts" : "customTexts");
}
