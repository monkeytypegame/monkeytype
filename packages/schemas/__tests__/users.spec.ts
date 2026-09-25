import { it, expect, describe } from "vitest";
import {
  ResultFilterPresetNameSchema,
  ResultFiltersSchema,
  StreakHourOffsetSchema,
  UserStreakSchema,
  TagNameSchema,
  UserTagSchema,
  TwitterProfileSchema,
  GithubProfileSchema,
  WebsiteSchema,
  UserProfileDetailsSchema,
  CustomThemeNameSchema,
  CustomThemeSchema,
  PremiumInfoSchema,
  UserQuoteRatingsSchema,
  UserLbMemorySchema,
  RankAndCountSchema,
  AllTimeLbsSchema,
  BadgeSchema,
  UserInventorySchema,
  QuoteModSchema,
  TestActivitySchema,
  CountByYearAndDaySchema,
  FavoriteQuotesSchema,
  UserEmailSchema,
  UserNameWithoutFilterSchema,
  UserNameSchema,
  UserSchema,
  TypingStatsSchema,
  UserProfileSchema,
  RewardTypeSchema,
  XpRewardSchema,
  BadgeRewardSchema,
  AllRewardsSchema,
  MonkeyMailSchema,
  ReportUserReasonSchema,
  PasswordSchema,
  FriendSchema,
} from "../src/users";

// Constants for complex nested objects
const validUserStreak = {
  lastResultTimestamp: 1234567890,
  length: 10,
  maxLength: 100,
};

const validUserTag = {
  _id: "tag123",
  name: "my_tag",
  personalBests: {
    time: { "10": [] },
    words: { "10": [] },
    quote: { "1": [] },
    custom: { custom: [] },
    zen: { zen: [] },
  },
};

const validUserProfileDetails = {
  bio: "Test user bio",
  keyboard: "Mechanical",
};

const validCustomTheme = {
  _id: "theme123",
  name: "my_theme",
  colors: [
    "#ffffff",
    "#000000",
    "#ff0000",
    "#00ff00",
    "#0000ff",
    "#ffff00",
    "#ff00ff",
    "#00ffff",
    "#ffffff",
    "#000000",
  ],
};

const validPremiumInfo = {
  startTimestamp: 1234567890,
  expirationTimestamp: -1,
};

const validUserQuoteRatings = {
  english: { "1": 5 },
};

const validUserLbMemory = {
  time: { "10": { english: 100 } },
};

const validRankAndCount = {
  rank: 1,
  count: 100,
};

const validAllTimeLbs = {
  time: { "10": { english: { count: 100 } } },
};

const validBadge = {
  id: 1,
};

const validUserInventory = {
  badges: [{ id: 1 }],
};

const validTestActivity = {
  testsByDays: [10, 20, 30],
  lastDay: 1234567890,
};

const validCountByYearAndDay = {
  "2023": [1, 2, 3],
};

const validFavoriteQuotes = {
  english: ["1", "2"],
};

const validUserEmail = "user@example.com";

const validUserNameWithoutFilter = "john_doe";

const validUserSchema = {
  name: "john_doe",
  email: "user@example.com",
  uid: "uid123",
  addedAt: 1234567890,
  personalBests: {
    time: {
      "10": [
        {
          acc: 95,
          consistency: 90,
          difficulty: "normal",
          language: "english",
          raw: 120,
          wpm: 100,
          timestamp: 1234567890,
        },
      ],
    },
    words: {
      "10": [
        {
          acc: 95,
          consistency: 90,
          difficulty: "normal",
          language: "english",
          raw: 120,
          wpm: 100,
          timestamp: 1234567890,
        },
      ],
    },
    quote: {
      "1": [
        {
          acc: 95,
          consistency: 90,
          difficulty: "normal",
          language: "english",
          raw: 120,
          wpm: 100,
          timestamp: 1234567890,
        },
      ],
    },
    custom: {
      custom: [
        {
          acc: 95,
          consistency: 90,
          difficulty: "normal",
          language: "english",
          raw: 120,
          wpm: 100,
          timestamp: 1234567890,
        },
      ],
    },
    zen: {
      zen: [
        {
          acc: 100,
          consistency: 90,
          difficulty: "normal",
          language: "english",
          raw: 120,
          wpm: 100,
          timestamp: 1234567890,
        },
      ],
    },
  },
  allTimeLbs: { time: { "10": { english: { count: 100 } } } },
};

const validTypingStats = {
  completedTests: 10,
  startedTests: 15,
  timeTyping: 3600,
};

const validUserProfile = {
  uid: "uid123",
  name: "john_doe",
  banned: false,
  addedAt: 1234567890,
  discordId: "discord123",
  discordAvatar: "avatar.png",
  xp: 1000,
  lbOptOut: false,
  isPremium: true,
  inventory: { badges: [{ id: 1 }] },
  allTimeLbs: { time: { "10": { english: { count: 100 } } } },
  testActivity: { testsByDays: [10], lastDay: 1234567890 },
  typingStats: { completedTests: 10, startedTests: 15, timeTyping: 3600 },
  personalBests: { time: { "10": [] }, words: { "10": [] } },
  streak: 10,
  maxStreak: 100,
  details: { bio: "Test" },
};

const validXpReward = {
  type: "xp",
  item: 1,
};

const validBadgeReward = {
  type: "badge",
  item: { id: 1 },
};

const validMonkeyMail = {
  id: "mail123",
  subject: "Welcome!",
  body: "Welcome to Monkeytype!",
  timestamp: 1234567890,
  read: false,
  rewards: [{ type: "xp", item: 1 }],
};

const validPassword = "Password123!";

describe("users schemas", () => {
  describe("ResultFilterPresetNameSchema", () => {
    it.each([
      { description: "valid preset name", input: validUserNameWithoutFilter },
      {
        description: "exceeds max length",
        input: "a".repeat(17),
        expectedError: "String must contain at most 16 character",
      },
    ] as const)("$description", ({ input, expectedError }) => {
      if (expectedError !== undefined) {
        expect(ResultFilterPresetNameSchema).toReject(input, expectedError);
      } else {
        expect(ResultFilterPresetNameSchema).toValidate(input);
      }
    });
  });

  describe("ResultFiltersSchema", () => {
    const validInput = {
      _id: "abc123",
      name: "my_preset",
      pb: { yes: true, no: false },
      difficulty: { normal: true, expert: false, master: true },
      mode: { time: true, words: true, quote: false, custom: true, zen: false },
      words: { "10": true, "25": false },
      time: { "30": true, "60": false },
      quoteLength: { short: true, medium: false, long: true, thicc: false },
      punctuation: { on: true, off: false },
      numbers: { on: true, off: false },
      date: {
        last_day: true,
        last_week: false,
        last_month: false,
        last_3months: false,
        all: false,
      },
      tags: { abc123: true, none: true },
      language: { english: true, spanish: false },
      funbox: { arrows: true, mirror: false },
    };

    it.each([
      { description: "valid result filters", input: validInput } as const,
      {
        description: "missing required field",
        input: { _id: "abc123" },
        expectedError: "Required",
      } as const,
    ])("$description", ({ input, expectedError }) => {
      if (expectedError !== undefined) {
        expect(ResultFiltersSchema).toReject(input, expectedError);
      } else {
        expect(ResultFiltersSchema).toValidate(input);
      }
    });
  });

  describe("StreakHourOffsetSchema", () => {
    it.each([
      { description: "valid offset 0", input: 0 } as const,
      { description: "valid offset 12", input: 12 } as const,
      { description: "valid negative offset -11", input: -11 } as const,
      {
        description: "exceeds max",
        input: 13,
        expectedError: "Number must be less than or equal to 12",
      } as const,
      {
        description: "below min",
        input: -12,
        expectedError: "Number must be greater than or equal to -11",
      } as const,
    ])("$description", ({ input, expectedError }) => {
      if (expectedError !== undefined) {
        expect(StreakHourOffsetSchema).toReject(input, expectedError);
      } else {
        expect(StreakHourOffsetSchema).toValidate(input);
      }
    });
  });

  describe("UserStreakSchema", () => {
    const validInput = { ...validUserStreak };

    it.each([
      { description: "valid user streak", input: validInput } as const,
      {
        description: "invalid - negative length",
        input: { ...validInput, length: -1 },
        expectedError: "Number must be greater than or equal to 0",
      } as const,
    ])("$description", ({ input, expectedError }) => {
      if (expectedError !== undefined) {
        expect(UserStreakSchema).toReject(input, expectedError);
      } else {
        expect(UserStreakSchema).toValidate(input);
      }
    });
  });

  describe("TagNameSchema", () => {
    it.each([
      {
        description: "valid tag name",
        input: validUserNameWithoutFilter,
      } as const,
      {
        description: "exceeds max length",
        input: "a".repeat(17),
        expectedError: "String must contain at most 16 character",
      } as const,
    ])("$description", ({ input, expectedError }) => {
      if (expectedError !== undefined) {
        expect(TagNameSchema).toReject(input, expectedError);
      } else {
        expect(TagNameSchema).toValidate(input);
      }
    });
  });

  describe("UserTagSchema", () => {
    const validInput = { ...validUserTag };

    it.each([
      { description: "valid user tag", input: validInput } as const,
      {
        description: "invalid - missing name",
        input: {
          _id: validUserTag._id,
          personalBests: validUserTag.personalBests,
        },
        expectedError: "Required",
      } as const,
    ])("$description", ({ input, expectedError }) => {
      if (expectedError !== undefined) {
        expect(UserTagSchema).toReject(input, expectedError);
      } else {
        expect(UserTagSchema).toValidate(input);
      }
    });
  });

  describe("TwitterProfileSchema", () => {
    it.each([
      {
        description: "valid twitter profile",
        input: validUserNameWithoutFilter,
      } as const,
      {
        description: "empty string is valid",
        input: "",
      } as const,
      {
        description: "exceeds max length (15)",
        input: "a".repeat(16),
        expectedError: "String must contain at most 15 character",
      } as const,
    ])("$description", ({ input, expectedError }) => {
      if (expectedError !== undefined) {
        expect(TwitterProfileSchema).toReject(input, expectedError);
      } else {
        expect(TwitterProfileSchema).toValidate(input);
      }
    });
  });

  describe("GithubProfileSchema", () => {
    it.each([
      {
        description: "valid github profile",
        input: validUserNameWithoutFilter,
      } as const,
      {
        description: "empty string is valid",
        input: "",
      } as const,
      {
        description: "exceeds max length (39)",
        input: "a".repeat(40),
        expectedError: "String must contain at most 39 character",
      } as const,
    ])("$description", ({ input, expectedError }) => {
      if (expectedError !== undefined) {
        expect(GithubProfileSchema).toReject(input, expectedError);
      } else {
        expect(GithubProfileSchema).toValidate(input);
      }
    });
  });

  describe("WebsiteSchema", () => {
    it.each([
      { description: "valid website", input: "https://example.com" } as const,
      {
        description: "empty string is valid",
        input: "",
      } as const,
      {
        description: "exceeds max length (200)",
        input: "a".repeat(201),
        expectedError: "String must contain at most 200 character",
      } as const,
    ])("$description", ({ input, expectedError }) => {
      if (expectedError !== undefined) {
        expect(WebsiteSchema).toReject(input, expectedError);
      } else {
        expect(WebsiteSchema).toValidate(input);
      }
    });
  });

  describe("UserProfileDetailsSchema", () => {
    const validInput = { ...validUserProfileDetails };

    it.each([
      { description: "valid user profile details", input: validInput } as const,
      {
        description: "with socialProfiles",
        input: {
          ...validInput,
          socialProfiles: { twitter: validUserNameWithoutFilter },
        },
      } as const,
      {
        description: "bio exceeds max length",
        input: { ...validInput, bio: "a".repeat(251) },
        expectedError: "String must contain at most 250 character",
      } as const,
    ])("$description", ({ input, expectedError }) => {
      if (expectedError !== undefined) {
        expect(UserProfileDetailsSchema).toReject(input, expectedError);
      } else {
        expect(UserProfileDetailsSchema).toValidate(input);
      }
    });
  });

  describe("CustomThemeNameSchema", () => {
    it.each([
      {
        description: "valid custom theme name",
        input: validUserNameWithoutFilter,
      } as const,
      {
        description: "exceeds max length",
        input: "a".repeat(17),
        expectedError: "String must contain at most 16 character",
      } as const,
    ])("$description", ({ input, expectedError }) => {
      if (expectedError !== undefined) {
        expect(CustomThemeNameSchema).toReject(input, expectedError);
      } else {
        expect(CustomThemeNameSchema).toValidate(input);
      }
    });
  });

  describe("CustomThemeSchema", () => {
    const validInput = { ...validCustomTheme };

    it.each([
      { description: "valid custom theme", input: validInput } as const,
      {
        description: "invalid - missing _id",
        input: { name: validCustomTheme.name, colors: validCustomTheme.colors },
        expectedError: "Required",
      } as const,
    ])("$description", ({ input, expectedError }) => {
      if (expectedError !== undefined) {
        expect(CustomThemeSchema).toReject(input, expectedError);
      } else {
        expect(CustomThemeSchema).toValidate(input);
      }
    });
  });

  describe("PremiumInfoSchema", () => {
    it.each([
      {
        description: "valid premium info with expiration",
        input: validPremiumInfo,
      } as const,
      {
        description: "valid lifetime premium",
        input: { startTimestamp: 1234567890, expirationTimestamp: -1 },
      } as const,
      {
        description: "invalid - negative startTimestamp",
        input: { ...validPremiumInfo, startTimestamp: -1 },
        expectedError: "Number must be greater than or equal to 0",
      } as const,
    ])("$description", ({ input, expectedError }) => {
      if (expectedError !== undefined) {
        expect(PremiumInfoSchema).toReject(input, expectedError);
      } else {
        expect(PremiumInfoSchema).toValidate(input);
      }
    });
  });

  describe("UserQuoteRatingsSchema", () => {
    it.each([
      {
        description: "valid user quote ratings",
        input: validUserQuoteRatings,
      } as const,
      {
        description: "invalid - negative rating",
        input: { english: { "1": -1 } },
        expectedError: "Number must be greater than or equal to 0",
      } as const,
    ])("$description", ({ input, expectedError }) => {
      if (expectedError !== undefined) {
        expect(UserQuoteRatingsSchema).toReject(input, expectedError);
      } else {
        expect(UserQuoteRatingsSchema).toValidate(input);
      }
    });
  });

  describe("UserLbMemorySchema", () => {
    it.each([
      {
        description: "valid user lb memory",
        input: validUserLbMemory,
      } as const,
      {
        description: "invalid - invalid value",
        input: { time: { "10": { english: "not-a-number" } } },
        expectedError: "Expected number, received string",
      } as const,
    ])("$description", ({ input, expectedError }) => {
      if (expectedError !== undefined) {
        expect(UserLbMemorySchema).toReject(input, expectedError);
      } else {
        expect(UserLbMemorySchema).toValidate(input);
      }
    });
  });

  describe("RankAndCountSchema", () => {
    it.each([
      { description: "valid rank and count", input: validRankAndCount },
      {
        description: "with optional rank",
        input: { count: 100 },
      },
    ] as const)("$description", ({ input }) => {
      expect(RankAndCountSchema).toValidate(input);
    });

    it("invalid - negative rank", () => {
      expect(RankAndCountSchema).toReject(
        { ...validRankAndCount, rank: -1 },
        "Number must be greater than or equal to 0",
      );
    });
  });

  describe("AllTimeLbsSchema", () => {
    it.each([
      { description: "valid all time lbs", input: validAllTimeLbs } as const,
    ])("$description", ({ input }) => {
      expect(AllTimeLbsSchema).toValidate(input);
    });
  });

  describe("BadgeSchema", () => {
    it.each([
      { description: "valid badge", input: validBadge } as const,
      {
        description: "with optional selected",
        input: { ...validBadge, selected: true },
      } as const,
    ])("$description", ({ input }) => {
      expect(BadgeSchema).toValidate(input);
    });
  });

  describe("UserInventorySchema", () => {
    it.each([
      {
        description: "valid user inventory",
        input: validUserInventory,
      } as const,
    ])("$description", ({ input }) => {
      expect(UserInventorySchema).toValidate(input);
    });
  });

  describe("QuoteModSchema", () => {
    it.each([
      { description: "valid admin for all languages", input: true } as const,
      {
        description: "valid admin for specific language",
        input: "english",
      } as const,
    ])("$description", ({ input }) => {
      expect(QuoteModSchema).toValidate(input);
    });
  });

  describe("TestActivitySchema", () => {
    const validInput = { ...validTestActivity };

    it.each([
      { description: "valid test activity", input: validInput } as const,
      {
        description: "with null values",
        input: { ...validInput, testsByDays: [10, null, 30] },
      } as const,
    ])("$description", ({ input }) => {
      expect(TestActivitySchema).toValidate(input);
    });
  });

  describe("CountByYearAndDaySchema", () => {
    it.each([
      {
        description: "valid count by year and day",
        input: validCountByYearAndDay,
      } as const,
    ])("$description", ({ input }) => {
      expect(CountByYearAndDaySchema).toValidate(input);
    });
  });

  describe("FavoriteQuotesSchema", () => {
    it.each([
      {
        description: "valid favorite quotes",
        input: validFavoriteQuotes,
      } as const,
    ])("$description", ({ input }) => {
      expect(FavoriteQuotesSchema).toValidate(input);
    });
  });

  describe("UserEmailSchema", () => {
    it.each([
      { description: "valid email", input: validUserEmail } as const,
      {
        description: "invalid email format",
        input: "not-an-email",
        expectedError: "Invalid email",
      } as const,
    ])("$description", ({ input, expectedError }) => {
      if (expectedError !== undefined) {
        expect(UserEmailSchema).toReject(input, expectedError);
      } else {
        expect(UserEmailSchema).toValidate(input);
      }
    });
  });

  describe("UserNameWithoutFilterSchema", () => {
    it.each([
      {
        description: "valid username without filter",
        input: validUserNameWithoutFilter,
      } as const,
      {
        description: "exceeds max length",
        input: "a".repeat(17),
        expectedError: "String must contain at most 16 character",
      } as const,
    ])("$description", ({ input, expectedError }) => {
      if (expectedError !== undefined) {
        expect(UserNameWithoutFilterSchema).toReject(input, expectedError);
      } else {
        expect(UserNameWithoutFilterSchema).toValidate(input);
      }
    });
  });

  describe("UserNameSchema", () => {
    it.each([
      {
        description: "valid username with filter",
        input: validUserNameWithoutFilter,
      } as const,
    ])("$description", ({ input }) => {
      expect(UserNameSchema).toValidate(input);
    });
  });

  describe("UserSchema", () => {
    const validInput = { ...validUserSchema };

    it.each([
      {
        description: "valid user with all required fields",
        input: validInput,
      } as const,
      {
        description: "with optional fields",
        input: { ...validInput, xp: 1000, banned: false },
      } as const,
    ])("$description", ({ input }) => {
      expect(UserSchema).toValidate(input);
    });

    it("invalid - missing required field", () => {
      expect(UserSchema).toReject({ name: "test" }, "Required");
    });
  });

  describe("TypingStatsSchema", () => {
    const validInput = { ...validTypingStats };

    it.each([
      { description: "valid typing stats", input: validInput } as const,
      {
        description: "with optional fields",
        input: { timeTyping: 3600 },
      } as const,
    ])("$description", ({ input }) => {
      expect(TypingStatsSchema).toValidate(input);
    });
  });

  describe("UserProfileSchema", () => {
    const validInput = { ...validUserProfile };

    it.each([
      { description: "valid user profile", input: validInput } as const,
    ])("$description", ({ input }) => {
      expect(UserProfileSchema).toValidate(input);
    });
  });

  describe("RewardTypeSchema", () => {
    it.each([
      { description: "valid reward type xp", input: "xp" } as const,
      {
        description: "invalid reward type",
        input: "invalid",
        expectedError: "Invalid enum value",
      } as const,
    ])("$description", ({ input, expectedError }) => {
      if (expectedError !== undefined) {
        expect(RewardTypeSchema).toReject(input, expectedError);
      } else {
        expect(RewardTypeSchema).toValidate(input);
      }
    });
  });

  describe("XpRewardSchema", () => {
    const validInput = { ...validXpReward };

    it.each([
      { description: "valid xp reward", input: validInput } as const,
      {
        description: "invalid - invalid item",
        input: { ...validXpReward, item: "not-a-number" },
        expectedError: "Expected number, received string",
      } as const,
    ])("$description", ({ input, expectedError }) => {
      if (expectedError !== undefined) {
        expect(XpRewardSchema).toReject(input, expectedError);
      } else {
        expect(XpRewardSchema).toValidate(input);
      }
    });
  });

  describe("BadgeRewardSchema", () => {
    const validInput = { ...validBadgeReward };

    it.each([
      { description: "valid badge reward", input: validInput } as const,
    ])("$description", ({ input }) => {
      expect(BadgeRewardSchema).toValidate(input);
    });
  });

  describe("AllRewardsSchema", () => {
    it.each([
      { description: "valid all rewards (xp)", input: validXpReward } as const,
      {
        description: "valid all rewards (badge)",
        input: validBadgeReward,
      } as const,
    ])("$description", ({ input }) => {
      expect(AllRewardsSchema).toValidate(input);
    });
  });

  describe("MonkeyMailSchema", () => {
    const validInput = { ...validMonkeyMail };

    it.each([
      { description: "valid monkey mail", input: validInput } as const,
      {
        description: "with read true",
        input: { ...validInput, read: true },
      } as const,
    ])("$description", ({ input }) => {
      expect(MonkeyMailSchema).toValidate(input);
    });
  });

  describe("ReportUserReasonSchema", () => {
    it.each([
      {
        description: "valid reason inappropriate name",
        input: "Inappropriate name",
      } as const,
      {
        description: "invalid reason",
        input: "invalid_reason",
        expectedError: "Invalid enum value",
      } as const,
    ])("$description", ({ input, expectedError }) => {
      if (expectedError !== undefined) {
        expect(ReportUserReasonSchema).toReject(input, expectedError);
      } else {
        expect(ReportUserReasonSchema).toValidate(input);
      }
    });
  });

  describe("PasswordSchema", () => {
    it.each([
      { description: "valid password", input: validPassword } as const,
      {
        description: "too short",
        input: "Pass1!",
        expectedError: "must be at least 8 characters",
      } as const,
      {
        description: "no uppercase letter",
        input: "password123!",
        expectedError: "must contain at least one capital letter",
      } as const,
    ])("$description", ({ input, expectedError }) => {
      if (expectedError !== undefined) {
        expect(PasswordSchema).toReject(input, expectedError);
      } else {
        expect(PasswordSchema).toValidate(input);
      }
    });
  });

  describe("FriendSchema", () => {
    const validInput = {
      uid: "friend123",
      name: "friend",
      discordId: "discord123",
      discordAvatar: "avatar.png",
      startedTests: 10,
      completedTests: 5,
      timeTyping: 3600,
      xp: 1000,
      banned: false,
      lbOptOut: false,
    };

    it.each([
      { description: "valid friend", input: validInput } as const,
      {
        description: "with optional connectionId",
        input: { ...validInput, connectionId: "conn123" },
      } as const,
    ])("$description", ({ input }) => {
      expect(FriendSchema).toValidate(input);
    });
  });
});
