import { replaceHomoglyphs } from "./homoglyphs";
import { profanities } from "./profanities";
import { ZodEffects, ZodString } from "zod";

export function containsProfanity(
  text: string,
  mode: "word" | "substring"
): boolean {
  const normalizedText = text
    .toLowerCase()
    .split(/[.,"/#!?$%^&*;:{}=\-_`~()\s\n]+/g)
    .map((str) => {
      return replaceHomoglyphs(sanitizeString(str) ?? "");
    });

  const hasProfanity = profanities.some((profanity) => {
    return normalizedText.some((word) => {
      return mode === "word"
        ? word.startsWith(profanity)
        : word.includes(profanity);
    });
  });

  return hasProfanity;
}

function sanitizeString(str: string | undefined): string | undefined {
  if (str === undefined || str === "") {
    return str;
  }

  return str
    .replace(/[\u0300-\u036F]/g, "")
    .trim()
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\s{3,}/g, "  ");
}

export function doesNotContainProfanity(
  mode: "word" | "substring",
  schema: ZodString
): ZodEffects<ZodString> {
  return schema.refine(
    (val) => {
      return !containsProfanity(val, mode);
    },
    (val) => ({
      message: `Profanity detected. Please remove it. If you believe this is a mistake, please contact us. (${val})`,
    })
  );
}
