import { z } from "zod";
import { LocalStorageWithSchema } from "../utils/local-storage-with-schema";

const ls = new LocalStorageWithSchema(
  "prefersArabicLazyMode",
  z.boolean(),
  true
);

export function get(): boolean {
  return ls.get();
}

export function set(value: boolean): void {
  ls.set(value);
}
