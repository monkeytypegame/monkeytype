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
import { differenceInDays, isBefore, isSameDay } from "date-fns";
import { createStore, produce, reconcile, unwrap } from "solid-js/store";

import Ape from "../ape";
import { configurationPromise } from "../ape/server-configuration";
import { fetchUserFromApi } from "../ape/user";
import { UserData } from "../constants/user-data";
import type { NormalizedLocalResult } from "../collections/results";
import { UserDataLoadError } from "../utils/user-data-load-error";
import { DeepReadonly } from "../utils/types";
import { isAuthenticated } from "./core";
import { setXpBarData } from "./header";

/**
 * The signed-in user's data. The auth flow loads it, sign-out clears it.
 * Written only through the named functions below.
 */
const [store, setStore] = createStore<{ value: UserData | undefined }>({
  value: undefined,
});

/** A plain copy of the user, detached from the store. */
function copyUserData(): UserData | undefined {
  const user = unwrap(store).value;
  return user === undefined ? undefined : structuredClone(user);
}

/**
 * The signed-in user, `undefined` while signed out, loading or after a failed
 * load. Reactive inside components and effects, a plain read elsewhere.
 */
export function getUserData(): DeepReadonly<UserData> | undefined {
  return store.value;
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

    const row: UserData = {
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

    setStore("value", reconcile(row, { merge: true }));
  } catch (e) {
    clearUserData();
    throw e;
  }

  return getUserData() as DeepReadonly<UserData>;
}

export function clearUserData(): void {
  setStore("value", undefined);
}

// --- Direct writes: mirror what the server already did ---

function update(recipe: (user: UserData) => void): void {
  if (store.value === undefined) return;
  setStore(
    "value",
    produce((user) => {
      if (user !== undefined) recipe(user);
    }),
  );
}

export function recordResult(
  result: NormalizedLocalResult<Mode>,
  options: { isPb: boolean },
): void {
  update((user) => {
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
  update((user) => {
    user.xp += xp;
  });
  setXpBarData({
    addedXp: xp,
    resultingXp: getUserData()?.xp ?? 0,
    breakdown,
  });
}

export function setStreak(streak: number): void {
  update((user) => {
    user.streak = streak;
    if (streak > user.maxStreak) user.maxStreak = streak;
  });
}

export function setInboxUnreadSize(size: number): void {
  update((user) => {
    user.inboxUnreadSize = size;
  });
}

export function addBadge(badge: Badge): void {
  update((user) => {
    user.inventory ??= { badges: [] };
    user.inventory.badges.push(badge);
  });
}

export function resetPersonalBests(): void {
  update((user) => {
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
  update((user) => {
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
  update((user) => {
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

/**
 * Applies `recipe` with `vars` at once and sends `request`, which resolves to
 * the values to keep (the server may change them); the recipe is applied
 * again with those. On failure the fields the recipe changed are rolled back,
 * except those changed again since (by a direct write or another action),
 * which keep the newer value. The recipe must be idempotent.
 */
async function optimisticUpdate<T>(
  vars: T,
  recipe: (user: UserData, vars: T) => void,
  request: () => Promise<T>,
): Promise<void> {
  const before = copyUserData();
  if (before === undefined) throw new Error("Not signed in");
  update((user) => recipe(user, vars));
  const written = copyUserData() ?? before;
  const same = (a: unknown, b: unknown): boolean =>
    JSON.stringify(a) === JSON.stringify(b);
  const changed = (
    Object.keys({ ...before, ...written }) as (keyof UserData)[]
  ).filter((key) => !same(before[key], written[key]));

  let kept: T;
  try {
    kept = await request();
  } catch (e) {
    update((user) => {
      for (const key of changed) {
        if (!same(user[key], written[key])) continue;
        (user as Record<string, unknown>)[key] = before[key];
      }
    });
    throw e;
  }
  update((user) => recipe(user, kept));
}

function throwIfFailed(response: {
  status: number;
  body: { message: string };
}): void {
  if (response.status !== 200) throw new Error(response.body.message);
}

export async function updateName(name: string): Promise<void> {
  await optimisticUpdate(
    name,
    (user, name) => {
      user.name = name;
    },
    async () => {
      throwIfFailed(await Ape.users.updateName({ body: { name } }));
      return name;
    },
  );
}

export async function unlinkDiscord(): Promise<void> {
  await optimisticUpdate(
    undefined,
    (user) => {
      user.discordId = undefined;
      user.discordAvatar = undefined;
    },
    async () => {
      throwIfFailed(await Ape.users.unlinkDiscord());
      return undefined;
    },
  );
}

export async function setStreakHourOffset(hourOffset: number): Promise<void> {
  await optimisticUpdate(
    hourOffset,
    (user, hourOffset) => {
      user.streakHourOffset = hourOffset;
    },
    async () => {
      throwIfFailed(
        await Ape.users.setStreakHourOffset({ body: { hourOffset } }),
      );
      return hourOffset;
    },
  );
}

type QuoteRating = { language: Language; quoteId: number; rating: number };

export async function rateQuote(rating: QuoteRating): Promise<void> {
  await optimisticUpdate(
    rating,
    (user, { language, quoteId, rating }) => {
      user.quoteRatings ??= {};
      user.quoteRatings[language] ??= {};
      user.quoteRatings[language][quoteId] = rating;
    },
    async () => {
      throwIfFailed(await Ape.quotes.addRating({ body: rating }));
      return rating;
    },
  );
}

type QuoteFavorite = { language: Language; quoteId: string; favorite: boolean };

export async function setQuoteFavorite(favorite: QuoteFavorite): Promise<void> {
  await optimisticUpdate(
    favorite,
    (user, { language, quoteId, favorite }) => {
      const list = user.favoriteQuotes?.[language] ?? [];
      const without = list.filter((id) => id !== quoteId);
      user.favoriteQuotes ??= {};
      user.favoriteQuotes[language] = favorite
        ? [...without, quoteId]
        : without;
    },
    async () => {
      const body = { language: favorite.language, quoteId: favorite.quoteId };
      throwIfFailed(
        favorite.favorite
          ? await Ape.users.addQuoteToFavorites({ body })
          : await Ape.users.removeQuoteFromFavorites({ body }),
      );
      return favorite;
    },
  );
}

type ProfileUpdate = {
  details: UserProfileDetails;
  selectedBadgeId: number;
};

export async function updateProfile(profile: ProfileUpdate): Promise<void> {
  await optimisticUpdate(
    profile,
    (user, { details, selectedBadgeId }) => {
      user.details = details;
      for (const badge of user.inventory?.badges ?? []) {
        badge.selected = badge.id === selectedBadgeId;
      }
    },
    async () => {
      const response = await Ape.users.updateProfile({
        body: { ...profile.details, selectedBadgeId: profile.selectedBadgeId },
      });
      if (response.status !== 200) throw new Error(response.body.message);
      // the server sanitizes the details
      return { ...profile, details: response.body.data ?? profile.details };
    },
  );
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
    setStore("value", user === undefined ? undefined : structuredClone(user));
  },
};
