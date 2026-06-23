import { z } from "zod";
import { FunboxNameSchema, PartialConfigSchema } from "./configs";

const MinRequiredNumber = z.object({ min: z.number() }).strict();
const MaxRequiredNumber = z.object({ max: z.number() }).strict();
const ExactRequiredNumber = z.object({ exact: z.number() }).strict();

import { customEnumErrorHandler } from "./util";

export const ChallengeNameSchema = z.enum(
  [
    "oneHourWarrior",
    "doubleDown",
    "tripleTrouble",
    "quad",
    "8Ball",
    "theBig12",
    "1Day",
    "trueSimp",
    "bigramSalad",
    "simp",
    "antidiseWhat",
    "whatsThisWebsiteCalledAgain",
    "developd",
    "slowAndSteady",
    "speedSpacer",
    "iveGotThePower",
    "accuracyExpert",
    "accuracyMaster",
    "accuracyGod",
    "inAGalaxyFarFarAway",
    "beepBoop",
    "whosYourDaddy",
    "itsATrap",
    "jolly",
    "gottaCatchEmAll",
    "rapGod",
    "navySeal",
    "littleChef",
    "crosstalk",
    "bees",
    "getOffMySwamp",
    "lookAtMeIAmTheDeveloperNow",
    "beLikeWater",
    "rollercoaster",
    "oneHourMirror",
    "chooChoo",
    "mnemonist",
    "earfquake",
    "simonSez",
    "accountant",
    "hidden",
    "iCanSeeTheFuture",
    "whatAreWordsAtThisPoint",
    "specials",
    "aeiou",
    "asciiWarrior",
    "oneNauseousMonkey",
    "thumbWarrior",
    "mouseWarrior",
    "mobileWarrior",
    "69",
    "upsideDown",
    "oneArmedBandit",
    "englishMaster",
    "feetWarrior",
    "wingdings",
    "iKiNdAlIkEhOwInEfFiCiEnTqWeRtYiS",
    "100hours",
    "250hours",
    "500hours",
  ],
  {
    errorMap: customEnumErrorHandler("Must be a known challenge name"),
  },
);

export type ChallengeName = z.infer<typeof ChallengeNameSchema>;

export const ChallengeSchema = z
  .object({
    name: ChallengeNameSchema,
    display: z.string(),
    autoRole: z.boolean().optional(),
    discordRoleId: z.string(),
    type: z.enum([
      "customTime",
      "customWords",
      "customText",
      "script",
      "accuracy",
      "funbox",
      "other",
      "hidden",
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
