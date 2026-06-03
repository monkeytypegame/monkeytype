import { PersonalBest } from "@monkeytype/schemas/shared";
import { UserProfile } from "@monkeytype/schemas/users";

import { FaSolidIcon } from "../types/font-awesome";
import { getLevelFromTotalXp } from "./levels";

type AchievementProgressFormatter = (
  progress: number,
  target: number,
) => string;

export type AchievementDefinition = {
  id: string;
  name: string;
  description: string;
  icon: FaSolidIcon;
  target: number;
  getProgress: (profile: UserProfile) => number;
  formatProgress?: AchievementProgressFormatter;
};

export type Achievement = AchievementDefinition & {
  progress: number;
  progressPercent: number;
  unlocked: boolean;
  progressLabel: string;
};

const formatIntegerProgress: AchievementProgressFormatter = (
  progress,
  target,
) => `${Math.floor(progress)}/${target}`;

const formatLevelProgress: AchievementProgressFormatter = (progress, target) =>
  `Level ${Math.floor(progress)}/${target}`;

const formatHourProgress: AchievementProgressFormatter = (progress, target) =>
  `${Math.floor(progress / 3600)}h/${Math.floor(target / 3600)}h`;

const achievementDefinitions: AchievementDefinition[] = [
  {
    id: "first_test",
    name: "First Steps",
    description: "Complete your first typing test.",
    icon: "fa-check-circle",
    target: 1,
    getProgress: (profile) => profile.typingStats.completedTests ?? 0,
  },
  {
    id: "hundred_tests",
    name: "Committed",
    description: "Complete 100 typing tests.",
    icon: "fa-tasks",
    target: 100,
    getProgress: (profile) => profile.typingStats.completedTests ?? 0,
  },
  {
    id: "typing_marathon",
    name: "Typing Marathon",
    description: "Spend 10 hours actively typing.",
    icon: "fa-hourglass-half",
    target: 10 * 60 * 60,
    getProgress: (profile) => profile.typingStats.timeTyping ?? 0,
    formatProgress: formatHourProgress,
  },
  {
    id: "weekly_streak",
    name: "On Fire",
    description: "Reach a 7 day streak.",
    icon: "fa-fire",
    target: 7,
    getProgress: (profile) => profile.maxStreak ?? 0,
  },
  {
    id: "level_ten",
    name: "Level 10",
    description: "Reach level 10.",
    icon: "fa-star",
    target: 10,
    getProgress: (profile) => getLevelFromTotalXp(profile.xp ?? 0),
    formatProgress: formatLevelProgress,
  },
  {
    id: "hundred_wpm",
    name: "Century",
    description: "Hit 100 WPM on any saved personal best.",
    icon: "fa-keyboard",
    target: 100,
    getProgress: (profile) => getHighestPersonalBestWpm(profile.personalBests),
  },
];

function getHighestPersonalBestWpm(
  personalBests: UserProfile["personalBests"],
): number {
  const allBests = [
    ...Object.values(personalBests.time),
    ...Object.values(personalBests.words),
  ].flat();

  return allBests.reduce(
    (highest: number, best: PersonalBest) => Math.max(highest, best.wpm ?? 0),
    0,
  );
}

export function getAchievements(profile: UserProfile): Achievement[] {
  return achievementDefinitions.map((definition) => {
    const rawProgress = definition.getProgress(profile);
    const progress = Math.min(rawProgress, definition.target);
    const unlocked = rawProgress >= definition.target;

    return {
      ...definition,
      progress: rawProgress,
      progressPercent:
        definition.target === 0 ? 100 : (progress / definition.target) * 100,
      unlocked,
      progressLabel: (definition.formatProgress ?? formatIntegerProgress)(
        rawProgress,
        definition.target,
      ),
    };
  });
}
