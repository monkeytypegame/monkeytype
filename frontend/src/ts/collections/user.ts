import { UTCDateMini } from "@date-fns/utc/date/mini";
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
import {
  createCollection,
  localOnlyCollectionOptions,
} from "@tanstack/solid-db";
import { differenceInDays, isBefore, isSameDay } from "date-fns";
import { createStore, reconcile } from "solid-js/store";

import Ape from "../ape";
import { configurationPromise } from "../ape/server-configuration";
import { fetchUserFromApi } from "../ape/user";
import { Snapshot, SnapshotResult } from "../constants/default-snapshot";
import { isAuthenticated } from "../states/core";
import { setXpBarData } from "../states/header";
import { SnapshotInitError } from "../utils/snapshot-init-error";
import { DeepReadonly } from "../utils/types";

/**
 * The signed-in user's data, a single row keyed by uid. Local only: the auth
 * flow loads it, sign-out clears it.
 */
const userCollection = createCollection(
  localOnlyCollectionOptions<Snapshot, string>({
    id: "user",
    getKey: (it) => it.uid,
  }),
);

const [mirror, setMirror] = createStore<{ value: Snapshot | undefined }>({
  value: undefined,
});

/** A copy of the row, without TanStack's virtual props (`$synced`...). */
function copyRow(): Snapshot | undefined {
  const row = userCollection.toArray[0];
  if (row === undefined) return undefined;
  return Object.fromEntries(
    Object.entries(structuredClone(row)).filter(
      ([key]) => !key.startsWith("$"),
    ),
  ) as Snapshot;
}

userCollection.subscribeChanges(
  () => {
    const row = copyRow();
    if (row === undefined) {
      setMirror("value", undefined);
    } else {
      setMirror("value", reconcile(row, { merge: true }));
    }
  },
  { includeInitialState: true },
);

/**
 * The signed-in user, `undefined` while signed out, loading or after a failed
 * load. Reactive inside components and effects, a plain read elsewhere.
 */
export function getUser(): DeepReadonly<Snapshot> | undefined {
  return mirror.value;
}

// --- Loading ---

/**
 * Downloads the user and replaces the row. Throws `SnapshotInitError` if the
 * request fails, leaving no user.
 */
export async function loadUserData(): Promise<DeepReadonly<Snapshot>> {
  await configurationPromise;

  if (!isAuthenticated()) {
    throw new Error(
      "Snapshot didn't initialize due to lacking authentication even though user is authenticated",
    );
  }

  try {
    const userData = await fetchUserFromApi();

    if (userData === null || userData === undefined) {
      throw new SnapshotInitError(
        `Request was successful but user data is null/undefined`,
        200,
      );
    }

    const personalBests = userData.personalBests ?? {};
    for (const mode of ["time", "words", "quote", "zen", "custom"] as const) {
      personalBests[mode] ??= {};
    }

    const row: Snapshot = {
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

    clearUser();
    userCollection.insert(row);
  } catch (e) {
    clearUser();
    throw e;
  }

  return getUser() as DeepReadonly<Snapshot>;
}

export function clearUser(): void {
  const keys = [...userCollection.keys()];
  if (keys.length > 0) userCollection.delete(keys);
}

// --- Direct writes: mirror what the server already did ---

function write(recipe: (user: Snapshot) => void): void {
  const uid = userCollection.toArray[0]?.uid;
  if (uid === undefined) return;
  userCollection.update(uid, recipe);
}

export function recordResult(
  result: SnapshotResult<Mode>,
  options: { isPb: boolean },
): void {
  write((user) => {
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
  if (getUser() === undefined) return;
  write((user) => {
    user.xp += xp;
  });
  setXpBarData({
    addedXp: xp,
    resultingXp: getUser()?.xp ?? 0,
    breakdown,
  });
}

export function setStreak(streak: number): void {
  write((user) => {
    user.streak = streak;
    if (streak > user.maxStreak) user.maxStreak = streak;
  });
}

export function setInboxUnreadSize(size: number): void {
  write((user) => {
    user.inboxUnreadSize = size;
  });
}

export function addBadge(badge: Badge): void {
  write((user) => {
    user.inventory ??= { badges: [] };
    user.inventory.badges.push(badge);
  });
}

export function resetPersonalBests(): void {
  write((user) => {
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
  write((user) => {
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
  const user = getUser();
  if (user === undefined) return;

  const current = user.lbMemory?.time?.[timeMode2]?.[language];
  write((user) => {
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
 * An action that applies `recipe` at once and sends `request`, which resolves
 * to the values to keep (the server may change them); the recipe is applied
 * again with those. On failure the fields the recipe changed are rolled back,
 * except those changed again since (by a direct write or another action),
 * which keep the newer value. Both are direct writes, not a TanStack
 * optimistic action: while one of those is pending, direct writes (eg.
 * `addXp`) are held back and hidden from it, so it would drop them when
 * keeping its row. The recipe must be idempotent.
 */
function optimisticAction<T>(
  recipe: (user: Snapshot, vars: T) => void,
  request: (vars: T) => Promise<T>,
): (vars: T) => Promise<void> {
  return async (vars) => {
    const before = copyRow();
    if (before === undefined) throw new Error("Not signed in");
    write((user) => recipe(user, vars));
    const written = copyRow() ?? before;
    const same = (a: unknown, b: unknown): boolean =>
      JSON.stringify(a) === JSON.stringify(b);
    const changed = (
      Object.keys({ ...before, ...written }) as (keyof Snapshot)[]
    ).filter((key) => !same(before[key], written[key]));

    let kept: T;
    try {
      kept = await request(vars);
    } catch (e) {
      write((user) => {
        for (const key of changed) {
          if (!same(user[key], written[key])) continue;
          (user as Record<string, unknown>)[key] = before[key];
        }
      });
      throw e;
    }
    write((user) => recipe(user, kept));
  };
}

function throwIfFailed(response: {
  status: number;
  body: { message: string };
}): void {
  if (response.status !== 200) throw new Error(response.body.message);
}

const updateNameAction = optimisticAction<{ name: string }>(
  (user, { name }) => {
    user.name = name;
  },
  async (vars) => {
    throwIfFailed(await Ape.users.updateName({ body: { name: vars.name } }));
    return vars;
  },
);

export async function updateName(name: string): Promise<void> {
  await updateNameAction({ name });
}

const unlinkDiscordAction = optimisticAction<undefined>(
  (user) => {
    user.discordId = undefined;
    user.discordAvatar = undefined;
  },
  async () => {
    throwIfFailed(await Ape.users.unlinkDiscord());
    return undefined;
  },
);

export async function unlinkDiscord(): Promise<void> {
  await unlinkDiscordAction(undefined);
}

const setStreakHourOffsetAction = optimisticAction<{ hourOffset: number }>(
  (user, { hourOffset }) => {
    user.streakHourOffset = hourOffset;
  },
  async (vars) => {
    throwIfFailed(await Ape.users.setStreakHourOffset({ body: vars }));
    return vars;
  },
);

export async function setStreakHourOffset(hourOffset: number): Promise<void> {
  await setStreakHourOffsetAction({ hourOffset });
}

type QuoteRating = { language: Language; quoteId: number; rating: number };

const rateQuoteAction = optimisticAction<QuoteRating>(
  (user, { language, quoteId, rating }) => {
    user.quoteRatings ??= {};
    user.quoteRatings[language] ??= {};
    user.quoteRatings[language][quoteId] = rating;
  },
  async (vars) => {
    throwIfFailed(await Ape.quotes.addRating({ body: vars }));
    return vars;
  },
);

export async function rateQuote(rating: QuoteRating): Promise<void> {
  await rateQuoteAction(rating);
}

type QuoteFavorite = { language: Language; quoteId: string; favorite: boolean };

const setQuoteFavoriteAction = optimisticAction<QuoteFavorite>(
  (user, { language, quoteId, favorite }) => {
    const list = user.favoriteQuotes?.[language] ?? [];
    const without = list.filter((id) => id !== quoteId);
    user.favoriteQuotes ??= {};
    user.favoriteQuotes[language] = favorite ? [...without, quoteId] : without;
  },
  async (vars) => {
    const body = { language: vars.language, quoteId: vars.quoteId };
    throwIfFailed(
      vars.favorite
        ? await Ape.users.addQuoteToFavorites({ body })
        : await Ape.users.removeQuoteFromFavorites({ body }),
    );
    return vars;
  },
);

export async function setQuoteFavorite(favorite: QuoteFavorite): Promise<void> {
  await setQuoteFavoriteAction(favorite);
}

type ProfileUpdate = {
  details: UserProfileDetails;
  selectedBadgeId: number;
};

function applyProfile(
  user: Snapshot,
  { details, selectedBadgeId }: ProfileUpdate,
): void {
  user.details = details;
  for (const badge of user.inventory?.badges ?? []) {
    badge.selected = badge.id === selectedBadgeId;
  }
}

const updateProfileAction = optimisticAction<ProfileUpdate>(
  applyProfile,
  async (update) => {
    const response = await Ape.users.updateProfile({
      body: { ...update.details, selectedBadgeId: update.selectedBadgeId },
    });
    if (response.status !== 200) throw new Error(response.body.message);
    // the server sanitizes the details
    return { ...update, details: response.body.data ?? update.details };
  },
);

export async function updateProfile(update: ProfileUpdate): Promise<void> {
  await updateProfileAction(update);
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
  result: SnapshotResult<Mode>,
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
    language: Language;
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
  /** Replaces the row without a download, for tests. */
  setUser(user: Snapshot | undefined): void {
    clearUser();
    if (user !== undefined) userCollection.insert(user);
  },
};
