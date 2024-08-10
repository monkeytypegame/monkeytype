import { z } from "zod";
import { LocalStorageWithSchema } from "../utils/local-storage-with-schema";

const ls = new LocalStorageWithSchema("prefersArabicLazyMode", z.boolean());

export function get(): boolean {
  return ls.get() ?? true;
}

export function set(value: boolean): void {
  ls.set(value);
}
