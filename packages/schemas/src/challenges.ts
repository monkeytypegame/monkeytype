import { z } from "zod";
import { FunboxNameSchema, PartialConfigSchema } from "./configs";

const NumberRequirementSchema = z
  .object({
    min: z.number(),
    max: z.number(),
    exact: z.number(),
  })
  .partial();
export type NumberRequirement = z.infer<typeof NumberRequirementSchema>;

export const ChallengeSchema = z.object({
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
      .or(z.array(FunboxNameSchema))
  ),
  requirements: z
    .object({
      wpm: NumberRequirementSchema,
      time: NumberRequirementSchema,
      acc: NumberRequirementSchema,
      raw: NumberRequirementSchema,
      con: NumberRequirementSchema,
      afk: NumberRequirementSchema,
      config: PartialConfigSchema,
      funbox: z
        .object({
          exact: z.array(FunboxNameSchema),
        })
        .partial(),
    })
    .partial()
    .optional(),
});

export type Challenge = z.infer<typeof ChallengeSchema>;
