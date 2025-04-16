import * as Notifications from "./elements/notifications";
import { ZodSchema, z } from "zod";

// function isConfigKeyValid(name: string): boolean {
//   if (name === null || name === undefined || name === "") return false;
//   if (name.length > 30) return false;
//   return /^[0-9a-zA-Z_.\-#+]+$/.test(name);
// }

export function invalid(
  key: string,
  val: unknown,
  customMessage?: string
): void {
  if (customMessage === undefined) {
    Notifications.add(
      `Invalid value for ${key} (${val}). Please try to change this setting again.`,
      -1
    );
  } else {
    Notifications.add(
      `Invalid value for ${key} (${val}). ${customMessage}`,
      -1
    );
  }

  console.error(`Invalid value key ${key} value ${val} type ${typeof val}`);
}

export function isConfigValueValid<T>(
  key: string,
  val: T,
  schema: ZodSchema<T>
): boolean {
  const isValid = schema.safeParse(val).success;
  if (!isValid) invalid(key, val, undefined);

  return isValid;
}
export function isConfigValueValidBoolean(key: string, val: boolean): boolean {
  return isConfigValueValid(key, val, z.boolean());
}
