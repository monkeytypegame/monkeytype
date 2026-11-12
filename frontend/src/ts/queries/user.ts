import { UTCDateMini } from "@date-fns/utc/date/mini";
import { FunboxMetadata } from "@monkeytype/funbox";
import { Difficulty } from "@monkeytype/schemas/configs";
import { Language } from "@monkeytype/schemas/languages";
import { XpBreakdown } from "@monkeytype/schemas/results";
import {
  Mode,
  Mode2,
  PersonalBest,
  PersonalBests,
} from "@monkeytype/schemas/shared";
import {
  Badge,
  TestActivity,
  UserProfileDetails,
} from "@monkeytype/schemas/users";
import { Result } from "@monkeytype/util/trycatch";
import { differenceInDays, isBefore, isSameDay } from "date-fns";

import Ape from "../ape";
import { configurationPromise } from "../ape/server-configuration";
import { fetchUserFromApi } from "../ape/user";
import type { NormalizedLocalResult } from "../collections/results";
import { UserData } from "../constants/user-data";
import { isAuthenticated } from "../states/core";
import { setXpBarData } from "../states/header";
import { UserDataLoadError } from "../utils/user-data-load-error";
import { DeepReadonly } from "../utils/types";
import { baseKey } from "./utils/keys";
import {
  type OptimisticMutation,
  optimisticMutation,
  runMutation,
} from "./utils/optimistic-mutation";
import { createSessionQuery } from "./utils/session-query";

/** The cached user. Readonly: writes go through `userQuery.update`. */
export type CachedUser = DeepReadonly<UserData>;

/**
 * The signed-in user's query: the auth flow downloads it, sign-out resets it
 * (with every `["user", ...]` query). Written only through the functions in
 * this module: direct writes mirror what the server already did, optimistic
 * actions call the API and roll back on failure.
 */
const userQuery = createSessionQuery<UserData>({
  key: baseKey("data", { isUserSpecific: true }),
  fetch: fetchUser,
});

/** The user query for components that need its status: see `use`. */
export const useUser = userQuery.use;

/** Downloads the user and maps the API shape. */
async function fetchUser(): Promise<UserData> {
  const userData = await fetchUserFromApi();

  if (userData === null || userData === undefined) {
    throw new UserDataLoadError(
      `Request was successful but user data is null/undefined`,
      200,
    );
  }

  const personalBests = userData.personalBests ?? {};
  for (const mode of ["time", "words", "quote", "zen", "custom"] as const) {
    personalBests[mode] ??= {};
  }

  return {
    uid: userData.uid,
    email: userData.email,
    name: userData.name,
    addedAt: userData.addedAt,
    personalBests,
    banned: userData.banned,
    lbOptOut: userData.lbOptOut,
    verified: userData.verified,
    discordId: userData.discordId,
    discordAvatar: userData.discordAvatar,
    needsToChangeName: userData.needsToChangeName,
    typingStats: {
      timeTyping: userData.timeTyping ?? 0,
      startedTests: userData.startedTests ?? 0,
      completedTests: userData.completedTests ?? 0,
    },
    quoteMod: userData.quoteMod,
    favoriteQuotes: userData.favoriteQuotes ?? {},
    quoteRatings: userData.quoteRatings,
    details: userData.profileDetails,
    inventory: userData.inventory,
    xp: userData.xp ?? 0,
    inboxUnreadSize: userData.inboxUnreadSize ?? 0,
    streak: userData.streak?.length ?? 0,
    maxStreak: userData.streak?.maxLength ?? 0,
    streakHourOffset: userData.streak?.hourOffset ?? undefined,
    isPremium: userData.isPremium ?? false,
    allTimeLbs: userData.allTimeLbs,
    testActivity: userData.testActivity,
    lbMemory: userData.lbMemory,
  };
}

/**
 * The signed-in user, `undefined` while signed out, loading or after a failed
 * load. Reactive inside components and effects, a plain read elsewhere.
 */
export function getUserData(): CachedUser | undefined {
  return userQuery.get();
}

// --- Loading ---

/**
 * Downloads the user and replaces the stored one. Throws `UserDataLoadError` if the
 * request fails, leaving no user.
 */
export async function loadUserData(): Promise<DeepReadonly<UserData>> {
  await configurationPromise;

  if (!isAuthenticated()) {
    throw new Error(
      "User data didn't load due to lacking authentication even though user is authenticated",
    );
  }

  try {
    await userQuery.download();
  } catch (e) {
    userQuery.reset();
    throw e;
  }

  return getUserData() as DeepReadonly<UserData>;
}

// --- Direct writes: mirror what the server already did ---

export function recordResult(
  result: NormalizedLocalResult<Mode>,
  options: { isPb: boolean },
): void {
  userQuery.update((user) => {
    if (user.testActivity !== undefined) {
      incrementTestActivity(user.testActivity, result.timestamp);
    }

    user.typingStats.timeTyping +=
      result.testDuration + result.incompleteTestSeconds - result.afkDuration;
    user.typingStats.startedTests += result.restartCount + 1;
    user.typingStats.completedTests += 1;

    if (options.isPb && result.mode !== "quote") {
      savePb(user.personalBests, result);
    }
  });
}

export function addXp(xp: number, breakdown?: XpBreakdown): void {
  if (getUserData() === undefined) return;
  userQuery.update((user) => {
    user.xp += xp;
  });
  setXpBarData({
    addedXp: xp,
    resultingXp: getUserData()?.xp ?? 0,
    breakdown,
  });
}

export function setStreak(streak: number): void {
  userQuery.update((user) => {
    user.streak = streak;
    if (streak > user.maxStreak) user.maxStreak = streak;
  });
}

export function setInboxUnreadSize(size: number): void {
  userQuery.update((user) => {
    user.inboxUnreadSize = size;
  });
}

export function addBadge(badge: Badge): void {
  userQuery.update((user) => {
    user.inventory ??= { badges: [] };
    user.inventory.badges.push(badge);
  });
}

export function resetPersonalBests(): void {
  userQuery.update((user) => {
    user.personalBests = {
      time: {},
      words: {},
      quote: {},
      zen: {},
      custom: {},
    };
  });
}

export function setDiscordLink(link: {
  discordId?: string;
  discordAvatar?: string;
}): void {
  userQuery.update((user) => {
    if (link.discordId !== undefined) user.discordId = link.discordId;
    if (link.discordAvatar !== undefined) {
      user.discordAvatar = link.discordAvatar;
    }
  });
}

/**
 * Saves the user's leaderboard rank. With `api`, also sends a changed rank to
 * the server, without rolling back if that fails.
 */
export async function updateLbMemory<M extends Mode>(
  mode: M,
  mode2: Mode2<M> | undefined,
  language: Language,
  rank: number,
  api = false,
): Promise<void> {
  if (mode2 === undefined || mode !== "time") return;
  const timeMode2 = mode2 as "15" | "60";
  const userData = getUserData();
  if (userData === undefined) return;

  const current = userData.lbMemory?.time?.[timeMode2]?.[language];
  userQuery.update((user) => {
    user.lbMemory ??= { time: { "15": { english: 0 }, "60": { english: 0 } } };
    user.lbMemory.time ??= { "15": { english: 0 }, "60": { english: 0 } };
    user.lbMemory.time[timeMode2] ??= {};
    user.lbMemory.time[timeMode2][language] = rank;
  });

  if (api && current !== rank) {
    await Ape.users.updateLeaderboardMemory({
      body: { mode, mode2, language, rank },
    });
  }
}

// --- Optimistic actions: user changes, rolled back if the request fails ---

/** An optimistic mutation on the user: see `optimisticMutation`. */
function userMutation<V>(
  name: string,
  recipe: (user: UserData, vars: V) => void,
  request: (vars: V) => Promise<V>,
): OptimisticMutation<UserData, V> {
  return optimisticMutation({ query: userQuery, name, recipe, request });
}

/** `kept` on a 200, else throws the server message. */
function keptOrThrow<T>(
  response: { status: number; body: { message: string } },
  kept: T,
): T {
  if (response.status !== 200) throw new Error(response.body.message);
  return kept;
}

const updateNameMutation = userMutation<string>(
  "updateName",
  (user, name) => {
    user.name = name;
  },
  async (name) =>
    keptOrThrow(await Ape.users.updateName({ body: { name } }), name),
);

export async function updateName(name: string): Promise<Result<void>> {
  return runMutation(updateNameMutation, name);
}

const unlinkDiscordMutation = userMutation<undefined>(
  "unlinkDiscord",
  (user) => {
    user.discordId = undefined;
    user.discordAvatar = undefined;
  },
  async () => keptOrThrow(await Ape.users.unlinkDiscord(), undefined),
);

export async function unlinkDiscord(): Promise<Result<void>> {
  return runMutation(unlinkDiscordMutation, undefined);
}

const setStreakHourOffsetMutation = userMutation<number>(
  "setStreakHourOffset",
  (user, hourOffset) => {
    user.streakHourOffset = hourOffset;
  },
  async (hourOffset) =>
    keptOrThrow(
      await Ape.users.setStreakHourOffset({ body: { hourOffset } }),
      hourOffset,
    ),
);

export async function setStreakHourOffset(
  hourOffset: number,
): Promise<Result<void>> {
  return runMutation(setStreakHourOffsetMutation, hourOffset);
}

type QuoteRating = { language: Language; quoteId: number; rating: number };

const rateQuoteMutation = userMutation<QuoteRating>(
  "rateQuote",
  (user, { language, quoteId, rating }) => {
    user.quoteRatings ??= {};
    user.quoteRatings[language] ??= {};
    user.quoteRatings[language][quoteId] = rating;
  },
  async (rating) =>
    keptOrThrow(await Ape.quotes.addRating({ body: rating }), rating),
);

export async function rateQuote(rating: QuoteRating): Promise<Result<void>> {
  return runMutation(rateQuoteMutation, rating);
}

type QuoteFavorite = { language: Language; quoteId: string; favorite: boolean };

const setQuoteFavoriteMutation = userMutation<QuoteFavorite>(
  "setQuoteFavorite",
  (user, { language, quoteId, favorite }) => {
    const list = user.favoriteQuotes?.[language] ?? [];
    const without = list.filter((id) => id !== quoteId);
    user.favoriteQuotes ??= {};
    user.favoriteQuotes[language] = favorite ? [...without, quoteId] : without;
  },
  async (favorite) => {
    const body = { language: favorite.language, quoteId: favorite.quoteId };
    return keptOrThrow(
      favorite.favorite
        ? await Ape.users.addQuoteToFavorites({ body })
        : await Ape.users.removeQuoteFromFavorites({ body }),
      favorite,
    );
  },
);

export async function setQuoteFavorite(
  favorite: QuoteFavorite,
): Promise<Result<void>> {
  return runMutation(setQuoteFavoriteMutation, favorite);
}

type ProfileUpdate = {
  details: UserProfileDetails;
  selectedBadgeId: number;
};

const updateProfileMutation = userMutation<ProfileUpdate>(
  "updateProfile",
  (user, { details, selectedBadgeId }) => {
    user.details = details;
    for (const badge of user.inventory?.badges ?? []) {
      badge.selected = badge.id === selectedBadgeId;
    }
  },
  async (profile) => {
    const response = await Ape.users.updateProfile({
      body: { ...profile.details, selectedBadgeId: profile.selectedBadgeId },
    });
    if (response.status !== 200) throw new Error(response.body.message);
    // the server sanitizes the details
    return { ...profile, details: response.body.data ?? profile.details };
  },
);

export async function updateProfile(
  profile: ProfileUpdate,
): Promise<Result<void>> {
  return runMutation(updateProfileMutation, profile);
}

// --- Reads ---

/** The user's PB matching these settings, if any and the funboxes allow PBs. */
export function getLocalPB<M extends Mode>(
  mode: M,
  mode2: Mode2<M>,
  punctuation: boolean,
  numbers: boolean,
  language: string,
  difficulty: Difficulty,
  lazyMode: boolean,
  funboxes: FunboxMetadata[],
): PersonalBest | undefined {
  if (!funboxes.every((f) => f.canGetPb)) return undefined;

  const byMode2: Readonly<Record<string, readonly PersonalBest[]>> | undefined =
    getUserData()?.personalBests?.[mode];
  return byMode2?.[mode2]?.find((pb) =>
    matchesPb(pb, { punctuation, numbers, difficulty, language, lazyMode }),
  );
}

// --- Helpers ---

function incrementTestActivity(
  activity: TestActivity,
  timestamp: number,
): void {
  const date = new UTCDateMini(timestamp);
  const lastDay = new UTCDateMini(activity.lastDay);
  if (isSameDay(date, lastDay)) {
    const last = activity.testsByDays.length - 1;
    activity.testsByDays[last] = (activity.testsByDays[last] ?? 0) + 1;
  } else if (isBefore(date, lastDay)) {
    throw new Error("cannot alter data in the past.");
  } else {
    const missedDays = differenceInDays(date, lastDay) - 1;
    for (let i = 0; i < missedDays; i++) activity.testsByDays.push(null);
    activity.testsByDays.push(1);
    activity.lastDay = timestamp;
  }
}

function savePb(
  personalBests: PersonalBests,
  result: NormalizedLocalResult<Mode>,
): void {
  const { mode, mode2, punctuation, numbers, language, difficulty } = result;
  const lazyMode = result.lazyMode;
  const pb = {
    wpm: result.wpm,
    acc: result.acc,
    raw: result.rawWpm,
    consistency: result.consistency,
    timestamp: Date.now(),
    lazyMode,
  };

  const byMode = (personalBests[mode] ??= {}) as Record<string, PersonalBest[]>;
  const list = (byMode[mode2] ??= []);
  const existing = list.find((it) =>
    matchesPb(it, { punctuation, numbers, difficulty, language, lazyMode }),
  );
  if (existing !== undefined) {
    Object.assign(existing, pb);
  } else {
    list.push({ ...pb, language, difficulty, punctuation, numbers });
  }
}

function matchesPb(
  pb: PersonalBest,
  key: {
    punctuation: boolean;
    numbers: boolean;
    difficulty: Difficulty;
    language: string;
    lazyMode: boolean;
  },
): boolean {
  return (
    (pb.punctuation ?? false) === key.punctuation &&
    (pb.numbers ?? false) === key.numbers &&
    pb.difficulty === key.difficulty &&
    pb.language === key.language &&
    (pb.lazyMode ?? false) === key.lazyMode
  );
}

export const __testing = {
  /** Replaces the user without a download, for tests. */
  setUser(user: UserData | undefined): void {
    userQuery.replace(user);
  },
};
