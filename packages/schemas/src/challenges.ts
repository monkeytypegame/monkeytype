import { z } from "zod";
import { FunboxNameSchema, PartialConfigSchema } from "./configs";

const MinRequiredNumber = z.object({ min: z.number() }).strict();
const MaxRequiredNumber = z.object({ max: z.number() }).strict();
const ExactRequiredNumber = z.object({ exact: z.number() }).strict();

export const ChallengeSchema = z
  .object({
    name: z.string(),
    display: z.string(),
    autoRole: z.boolean().optional(),
    type: z.enum([
      "customTime",
      "customWords",
      "customText",
      "script",
      "accuracy",
      "funbox",
    ]),
    message: z.string().optional(),
    parameters: z.array(
      z
        .string()
        .or(z.null())
        .or(z.number())
        .or(z.boolean())
        .or(z.array(FunboxNameSchema)),
    ),
    requirements: z
      .object({
        wpm: ExactRequiredNumber.or(MinRequiredNumber),
        acc: ExactRequiredNumber.or(MinRequiredNumber),
        afk: MaxRequiredNumber,
        time: MinRequiredNumber,
        funbox: z
          .object({
            exact: z.array(FunboxNameSchema),
          })
          .partial(),
        raw: ExactRequiredNumber,
        con: ExactRequiredNumber,
        config: PartialConfigSchema,
      })
      .partial()
      .strict()
      .optional(),
  })
  .strict();

export type Challenge = z.infer<typeof ChallengeSchema>;
