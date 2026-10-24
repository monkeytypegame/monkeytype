import { z } from "zod";
import { LocalStorageWithSchema } from "../utils/local-storage-with-schema";

const rememberLazyModeLS = new LocalStorageWithSchema({
  key: "rememberLazyMode",
  schema: z.boolean(),
  fallback: false,
});

const arabicLazyModeLS = new LocalStorageWithSchema({
  key: "prefersArabicLazyMode",
  schema: z.boolean(),
  fallback: true,
});

export function getRememberLazyMode(): boolean {
  return rememberLazyModeLS.get();
}

export function setRememberLazyMode(value: boolean): void {
  rememberLazyModeLS.set(value);
}

export function getPrefersArabicLazyMode(): boolean {
  return arabicLazyModeLS.get();
}

export function setPrefersArabicLazyMode(value: boolean): void {
  arabicLazyModeLS.set(value);
}
