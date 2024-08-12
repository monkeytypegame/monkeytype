import { z } from "zod";
import { LocalStorageWithSchema } from "../utils/local-storage-with-schema";

const ls = new LocalStorageWithSchema({
  key: "prefersArabicLazyMode",
  schema: z.boolean(),
  fallback: true,
});

export function get(): boolean {
  return ls.get();
}

export function set(value: boolean): void {
  ls.set(value);
}
