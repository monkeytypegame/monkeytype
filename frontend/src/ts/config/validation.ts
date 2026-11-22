import { showErrorNotification } from "../states/notifications";
import { ZodSchema, z } from "zod";
import { captureSentryException } from "../integrations/sentry";

// function isConfigKeyValid(name: string): boolean {
//   if (name === null || name === undefined || name === "") return false;
//   if (name.length > 30) return false;
//   return /^[0-9a-zA-Z_.\-#+]+$/.test(name);
// }

export function invalid(
  key: string,
  val: unknown,
  customMessage?: string,
): void {
  let message = `Invalid value for ${key} (${val}). Please try to change this setting again.`;

  if (customMessage !== undefined) {
    message = `Invalid value for ${key} (${val}). ${customMessage}`;
  }

  showErrorNotification(message);
  console.error(message);
  void captureSentryException(new Error(message));
}

export function isConfigValueValid<T>(
  key: string,
  val: T,
  schema: ZodSchema<T>,
): boolean {
  const isValid = schema.safeParse(val).success;
  if (!isValid) invalid(key, val, undefined);

  return isValid;
}

export function isConfigValueValidBoolean(key: string, val: boolean): boolean {
  return isConfigValueValid(key, val, z.boolean());
}
