import { z } from "zod";
import { LayoutNameSchema } from "@monkeytype/schemas/layouts";

export const practiceConfigSchema = z
  .object({
    layout: LayoutNameSchema,
    preset: z.string().max(80),
    characters: z.array(z.string().length(1).regex(/\S/u)).max(200),
    category: z.enum(["letters", "digits", "symbols", "all"]),
    layer: z.enum(["base", "shift", "both"]),
    style: z.enum(["balanced", "patterns", "words"]),
    amount: z.number().int().min(1).max(500),
    minLength: z.number().int().min(1).max(6),
    maxLength: z.number().int().min(1).max(6),
  })
  .refine((value) => value.minLength <= value.maxLength, {
    message: "Minimum length must not exceed maximum length",
  });

export type PracticeConfig = z.infer<typeof practiceConfigSchema>;
export type Finger = "lp" | "lr" | "lm" | "li" | "ri" | "rm" | "rr" | "rp";
export type PracticeKey = {
  id: string;
  row: number;
  column: number;
  variants: string[];
  finger?: Finger;
};
export type Exercise = {
  tokens: string[];
  matchingWords: number | null;
  missingCharacters: string[];
};

export const defaultConfig: PracticeConfig = {
  layout: "qwerty",
  preset: "bothHands",
  characters: Array.from("qwertyuiopasdfghjklzxcvbnm"),
  category: "letters",
  layer: "base",
  style: "balanced",
  amount: 50,
  minLength: 2,
  maxLength: 5,
};
