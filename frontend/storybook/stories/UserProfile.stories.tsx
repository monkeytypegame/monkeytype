import preview from "#.storybook/preview";
import { UserProfile as UserProfileType } from "@monkeytype/schemas/users";

import { UserProfile } from "../../src/ts/components/pages/profile/UserProfile";

const baseProfile: UserProfileType = {
  uid: "user123",
  name: "monkeytyper",
  addedAt: 1700000000000,
  xp: 42000,
  streak: 15,
  maxStreak: 30,
  isPremium: false,
  banned: false,
  lbOptOut: false,
  typingStats: {
    completedTests: 1234,
    startedTests: 1500,
    timeTyping: 360000,
  },
  personalBests: {
    time: {
      "15": [
        {
          acc: 97.5,
          consistency: 82.3,
          difficulty: "normal",
          language: "english",
          raw: 145,
          wpm: 138,
          timestamp: 1700000000000,
        },
      ],
      "30": [
        {
          acc: 96.2,
          consistency: 80.1,
          difficulty: "normal",
          language: "english",
          raw: 140,
          wpm: 132,
          timestamp: 1699000000000,
        },
      ],
      "60": [
        {
          acc: 95.8,
          consistency: 78.5,
          difficulty: "normal",
          language: "english",
          raw: 135,
          wpm: 125,
          timestamp: 1698000000000,
        },
      ],
      "120": [],
    },
    words: {
      "10": [
        {
          acc: 100,
          consistency: 90.0,
          difficulty: "normal",
          language: "english",
          raw: 160,
          wpm: 155,
          timestamp: 1700000000000,
        },
      ],
      "25": [
        {
          acc: 98.0,
          consistency: 85.0,
          difficulty: "normal",
          language: "english",
          raw: 150,
          wpm: 142,
          timestamp: 1699000000000,
        },
      ],
      "50": [
        {
          acc: 96.5,
          consistency: 81.0,
          difficulty: "normal",
          language: "english",
          raw: 142,
          wpm: 130,
          timestamp: 1698000000000,
        },
      ],
      "100": [
        {
          acc: 95.0,
          consistency: 79.0,
          difficulty: "normal",
          language: "english",
          raw: 138,
          wpm: 122,
          timestamp: 1697000000000,
        },
      ],
    },
  },
  details: {
    bio: "Just a monkey typing away",
    keyboard: "Custom 65%",
    socialProfiles: {
      twitter: "monkeytyper",
      github: "monkeytyper",
      website: "https://example.com",
    },
  },
  // this is styled using global styles so it wont show up correctly in storybook
  // testActivity: {
  //   testsByDays: [
  //     null,
  //     2,
  //     5,
  //     null,
  //     3,
  //     8,
  //     12,
  //     null,
  //     null,
  //     1,
  //     4,
  //     6,
  //     null,
  //     7,
  //     3,
  //     null,
  //     null,
  //     5,
  //     9,
  //     2,
  //     null,
  //     null,
  //     4,
  //     6,
  //     11,
  //     3,
  //     null,
  //     8,
  //     2,
  //     5,
  //   ],
  //   lastDay: 1700000000000,
  // },
  inventory: {
    badges: [{ id: 1, selected: true }],
  },
};

const meta = preview.meta({
  title: "Pages/UserProfile",
  component: UserProfile,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
});

export const Default = meta.story({
  args: {
    profile: baseProfile,
  },
});

export const AccountPage = meta.story({
  args: {
    profile: baseProfile,
    isAccountPage: true,
  },
});

export const WithLeaderboard = meta.story({
  args: {
    profile: {
      ...baseProfile,
      allTimeLbs: {
        time: {
          "15": {
            english: {
              rank: 42,
              count: 50000,
            },
          },
          "60": {
            english: {
              rank: 156,
              count: 50000,
            },
          },
        },
      },
    },
  },
});

export const Banned = meta.story({
  args: {
    profile: {
      ...baseProfile,
      banned: true,
      details: undefined,
      inventory: undefined,
    },
  },
});

export const LbOptOut = meta.story({
  args: {
    profile: {
      ...baseProfile,
      lbOptOut: true,
    },
  },
});

export const NoPbs = meta.story({
  args: {
    profile: {
      ...baseProfile,
      personalBests: {
        time: {},
        words: {},
      },
    },
  },
});

export const Premium = meta.story({
  args: {
    profile: {
      ...baseProfile,
      isPremium: true,
    },
  },
});
