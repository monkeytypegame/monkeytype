import { z, ZodString } from "zod";
import { IdSchema, LanguageSchema, StringNumberSchema, token } from "./util";
import { ModeSchema, Mode2Schema, PersonalBestsSchema } from "./shared";
import { CustomThemeColorsSchema } from "./configs";
import { QuoteRatingSchema } from "./quotes";

export const ResultFiltersSchema = z.object({
  _id: IdSchema,
  name: z
    .string()
    .regex(/^[0-9a-zA-Z_.-]+$/)
    .max(16),
  pb: z
    .object({
      no: z.boolean(),
      yes: z.boolean(),
    })
    .strict(),
  difficulty: z
    .object({
      normal: z.boolean(),
      expert: z.boolean(),
      master: z.boolean(),
    })
    .strict(),
  mode: z.record(ModeSchema, z.boolean()),
  words: z
    .object({
      10: z.boolean(),
      25: z.boolean(),
      50: z.boolean(),
      100: z.boolean(),
      custom: z.boolean(),
    })
    .strict(),
  time: z
    .object({
      15: z.boolean(),
      30: z.boolean(),
      60: z.boolean(),
      120: z.boolean(),
      custom: z.boolean(),
    })
    .strict(),
  quoteLength: z
    .object({
      short: z.boolean(),
      medium: z.boolean(),
      long: z.boolean(),
      thicc: z.boolean(),
    })
    .strict(),
  punctuation: z
    .object({
      on: z.boolean(),
      off: z.boolean(),
    })
    .strict(),
  numbers: z
    .object({
      on: z.boolean(),
      off: z.boolean(),
    })
    .strict(),
  date: z
    .object({
      last_day: z.boolean(),
      last_week: z.boolean(),
      last_month: z.boolean(),
      last_3months: z.boolean(),
      all: z.boolean(),
    })
    .strict(),
  tags: z.record(z.string(), z.boolean()),
  language: z.record(LanguageSchema, z.boolean()),
  funbox: z.record(z.string(), z.boolean()),
});
export type ResultFilters = z.infer<typeof ResultFiltersSchema>;

export const StreakHourOffsetSchema = z.number().int().min(-11).max(12);
export type StreakHourOffset = z.infer<typeof StreakHourOffsetSchema>;

export const UserStreakSchema = z
  .object({
    lastResultTimestamp: z.number().int().nonnegative(),
    length: z.number().int().nonnegative(),
    maxLength: z.number().int().nonnegative(),
    hourOffset: StreakHourOffsetSchema.optional(),
  })
  .strict();
export type UserStreak = z.infer<typeof UserStreakSchema>;

export const UserTagSchema = z
  .object({
    _id: IdSchema,
    name: z.string(),
    personalBests: PersonalBestsSchema,
  })
  .strict();
export type UserTag = z.infer<typeof UserTagSchema>;

function profileDetailsBase(
  customizer: (schema: ZodString) => void
): z.ZodEffects<
  z.ZodOptional<z.ZodNullable<z.ZodString>>,
  string | undefined,
  string | null | undefined
> {
  const schema = z.string();
  customizer(schema);
  return schema
    .nullable() //TODO profanity check
    .optional()
    .transform((value) => value ?? undefined);
}

export const UserProfileDetailsSchema = z
  .object({
    bio: profileDetailsBase((it) => it.max(255)),
    keyboard: profileDetailsBase((it) => it.max(75)),
    socialProfiles: z
      .object({
        twitter: profileDetailsBase((it) =>
          it.max(20).regex(/^[0-9a-zA-Z_.-]+$/)
        ),
        github: profileDetailsBase((it) =>
          it.max(39).regex(/^[0-9a-zA-Z_.-]+$/)
        ),
        website: profileDetailsBase((it) => it.url().max(200)), //https?
      })
      .strict(),
  })
  .strict();
export type UserProfileDetails = z.infer<typeof UserProfileDetailsSchema>;

export const CustomThemeSchema = z
  .object({
    _id: IdSchema,
    name: token(),
    colors: CustomThemeColorsSchema,
  })
  .strict();
export type CustomTheme = z.infer<typeof CustomThemeColorsSchema>;

export const PremiumInfoSchema = z.object({
  startTimestamp: z.number().int().nonnegative(),
  expirationTimestamp: z
    .number()
    .int()
    .nonnegative()
    .or(z.literal(-1).describe("lifetime premium")),
});
export type PremiumInfo = z.infer<typeof PremiumInfoSchema>;

export const UserLbMemorySchema = z.record(
  ModeSchema,
  z.record(
    Mode2Schema,
    z.record(LanguageSchema, z.number().int().nonnegative())
  )
);
export type UserLbMemory = z.infer<typeof UserLbMemorySchema>;

export const AllTimeLbsSchema = z.object({
  time: z.record(
    Mode2Schema,
    z.record(
      LanguageSchema,
      z.object({
        rank: z.number().int().nonnegative().optional(),
        count: z.number().int().nonnegative(),
      })
    )
  ),
});
export type AllTimeLbs = z.infer<typeof AllTimeLbsSchema>;

export const BadgeSchema = z
  .object({
    id: z.number().int().nonnegative(),
    selected: z.boolean().optional(),
  })
  .strict();
export type Badge = z.infer<typeof BadgeSchema>;

export const UserInventorySchema = z
  .object({
    badges: z.array(BadgeSchema),
  })
  .strict();
export type UserInventory = z.infer<typeof UserInventorySchema>;

export const QuoteModSchema = z
  .literal(true)
  .describe("Admin for all languages")
  .or(LanguageSchema.describe("Admiin for the given language"));
export type QuoteMod = z.infer<typeof QuoteModSchema>;

export const TestActivitySchema = z
  .object({
    testsByDays: z
      .array(z.number().int().nonnegative().or(z.null()))
      .describe(
        "Number of tests by day. Last element of the array is on the date `lastDay`. `null` means no tests on that day."
      ),
    lastDay: z
      .number()
      .int()
      .nonnegative()
      .describe("Timestamp of the last day included in the test activity"),
  })
  .strict();
export type TestActivity = z.infer<typeof TestActivitySchema>;

export const CountByYearAndDaySchema = z.record(
  StringNumberSchema.describe("year"),
  z.array(
    z
      .number()
      .int()
      .nonnegative()
      .nullable()
      .describe("number of tests, position in the array is the day of the year")
  )
);
export type CountByYearAndDay = z.infer<typeof CountByYearAndDaySchema>;

//Record<language, array with quoteIds as string
export const FavoriteQuotesSchema = z.record(
  LanguageSchema,
  z.array(StringNumberSchema)
);
export type FavoriteQuotes = z.infer<typeof FavoriteQuotesSchema>;

export const UserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  uid: z.string(), //defined by firebase, no validation should be applied
  addedAt: z.number().int().nonnegative(),
  personalBests: PersonalBestsSchema,
  lastResultHashes: z.array(z.string()).optional(),
  completedTests: z.number().int().nonnegative().optional(),
  startedTests: z.number().int().nonnegative().optional(),
  timeTyping: z.number().int().nonnegative().optional(),
  streak: UserStreakSchema.optional(),
  xp: z.number().int().nonnegative().optional(),
  discordId: z.string().optional(),
  discordAvatar: z.string().optional(),
  tags: z.array(UserTagSchema).optional(),
  profileDetails: UserProfileDetailsSchema.optional(),
  customThemes: CustomThemeSchema.optional(),
  premium: PremiumInfoSchema.optional(),
  isPremium: z.boolean().optional(),
  quoteRatings: QuoteRatingSchema.optional(),
  favoriteQuotes: FavoriteQuotesSchema.optional(),
  lbMemory: UserLbMemorySchema.optional(),
  allTimeLbs: AllTimeLbsSchema,
  inventory: UserInventorySchema.optional(),
  banned: z.boolean().optional(),
  lbOptOut: z.boolean().optional(),
  verified: z.boolean().optional(),
  needsToChangeName: z.boolean().optional(),
  quoteMod: QuoteModSchema.optional(),
  resultFilterPresets: z.array(ResultFiltersSchema).optional(),
  testActicity: TestActivitySchema.optional(),
});
export type User = z.infer<typeof UserSchema>;

export type ResultFiltersGroup = keyof ResultFilters;

export type ResultFiltersGroupItem<T extends ResultFiltersGroup> =
  keyof ResultFilters[T];

export const TagNameSchema = z
  .string()
  .regex(/^[0-9a-zA-Z_.-]+$/)
  .max(16);
export type TagName = z.infer<typeof TagNameSchema>;

export const CustomThemeNameSchema = z
  .string()
  .regex(/^[0-9a-zA-Z_-]+$/)
  .max(16);
export type CustomThemeName = z.infer<typeof CustomThemeNameSchema>;

export const TypingStatsSchema = z.object({
  completedTests: z.number().int().nonnegative().optional(),
  startedTests: z.number().int().nonnegative().optional(),
  timeTyping: z.number().int().nonnegative().optional(),
});
export type TypingStats = z.infer<typeof TypingStatsSchema>;

export const UserProfileSchema = UserSchema.pick({
  uid: true,
  name: true,
  banned: true,
  addedAt: true,
  discordId: true,
  discordAvatar: true,
  xp: true,
  lbOptOut: true,
  isPremium: true,
  inventory: true,
  allTimeLbs: true,
}).extend({
  typingStats: TypingStatsSchema,
  personalBests: PersonalBestsSchema.pick({ time: true, words: true }),
  streak: z.number().int().nonnegative(),
  maxStreak: z.number().int().nonnegative(),

  details: UserProfileDetailsSchema,
});
export type UserProfile = z.infer<typeof UserProfileSchema>;

export const RewardTypeSchema = z.enum(["xp", "badge"]);
export type RewardType = z.infer<typeof RewardTypeSchema>;

export const XpRewardSchema = z.object({
  type: z.literal(RewardTypeSchema.enum.xp),
  item: z.number().int(),
});
export type XpReward = z.infer<typeof XpRewardSchema>;

export const BadgeRewardSchema = z.object({
  type: z.literal(RewardTypeSchema.enum.badge),
  item: BadgeSchema,
});
export type BadgeReward = z.infer<typeof BadgeRewardSchema>;

export const AllRewardsSchema = XpRewardSchema.or(BadgeRewardSchema);
export type AllRewards = z.infer<typeof AllRewardsSchema>;

export const MonkeyMailSchema = z.object({
  id: IdSchema,
  subject: z.string(),
  body: z.string(),
  timestamp: z.number().int().nonnegative(),
  read: z.boolean(),
  rewards: z.array(AllRewardsSchema),
});
export type MonkeyMail = z.infer<typeof MonkeyMailSchema>;
