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
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { createCollection, createOptimisticAction } from "@tanstack/solid-db";
import { differenceInDays, isBefore, isSameDay } from "date-fns";
import { createStore, reconcile } from "solid-js/store";

import Ape from "../ape";
import { configurationPromise } from "../ape/server-configuration";
import { fetchUserFromApi } from "../ape/user";
import { Snapshot, SnapshotResult } from "../constants/default-snapshot";
import { queryClient } from "../queries";
import { baseKey } from "../queries/utils/keys";
import { isAuthenticated } from "../states/core";
import { setXpBarData } from "../states/header";
import { SnapshotInitError } from "../utils/snapshot-init-error";
import { DeepReadonly } from "../utils/types";

type UserData = NonNullable<Awaited<ReturnType<typeof fetchUserFromApi>>>;

let loadError: Error | undefined;

const queryKeys = {
  root: () => [...baseKey("userData", { isUserSpecific: true })],
};

/**
 * The signed-in user's data, a single row keyed by uid, loaded from the cached
 * user response while signed in.
 */
const userCollection = createCollection(
  queryCollectionOptions({
    staleTime: Infinity,
    gcTime: Infinity,
    queryKey: queryKeys.root(),
    queryClient,
    enabled: isAuthenticated,
    getKey: (it: Snapshot) => it.uid,
    // never throws: a failed first load would put the collection in its
    // error state, which refuses writes. `loadUserData` rethrows instead.
    queryFn: async () => {
      loadError = undefined;
      try {
        const userData = await fetchUserFromApi();
        return userData === undefined ? [] : [toRow(userData)];
      } catch (e) {
        loadError = e instanceof Error ? e : new Error(String(e));
        return [];
      }
    },
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

function toRow(userData: UserData): Snapshot {
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
 * Waits for the user to be in the row (fetching if needed). Throws
 * `SnapshotInitError` if the request fails, leaving no user.
 */
export async function loadUserData(): Promise<DeepReadonly<Snapshot>> {
  await configurationPromise;

  if (!isAuthenticated()) {
    throw new Error(
      "Snapshot didn't initialize due to lacking authentication even though user is authenticated",
    );
  }

  await userCollection.utils.refetch({ throwOnError: true });
  if (loadError !== undefined) throw loadError;

  const user = getUser();
  if (user === undefined) {
    throw new SnapshotInitError(
      `Request was successful but user data is null/undefined`,
      200,
    );
  }
  return user;
}

export function clearUser(): void {
  const keys = [...userCollection.keys()];
  if (keys.length > 0) void userCollection.utils.writeDelete(keys);
}

// --- Direct writes: mirror what the server already did ---

/**
 * Applies `recipe` to a copy of the row and writes the top-level fields it
 * changed to the synced row (no API call). Fields only a pending optimistic
 * action changed are left alone.
 */
function write(recipe: (user: Snapshot) => void): void {
  const before = copyRow();
  if (before === undefined) return;
  const after = structuredClone(before);
  recipe(after);
  const changed = Object.fromEntries(
    (Object.keys(after) as (keyof Snapshot)[])
      .filter(
        (key) => JSON.stringify(before[key]) !== JSON.stringify(after[key]),
      )
      .map((key) => [key, after[key]]),
  ) as Partial<Snapshot>;
  if (Object.keys(changed).length === 0) return;
  void userCollection.utils.writeUpdate({ uid: before.uid, ...changed });
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
  const current = getUser()?.xp;
  if (current === undefined) return;
  write((user) => {
    user.xp += xp;
  });
  // not read back: a pending optimistic action holds direct writes back
  setXpBarData({ addedXp: xp, resultingXp: current + xp, breakdown });
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

type QuoteRating = { language: Language; quoteId: number; rating: number };
type QuoteFavorite = { language: Language; quoteId: string; favorite: boolean };
type ProfileUpdate = {
  details: UserProfileDetails;
  selectedBadgeId: number;
};

type ActionType = {
  updateName: { name: string };
  unlinkDiscord: Record<string, never>;
  setStreakHourOffset: { hourOffset: number };
  rateQuote: QuoteRating;
  setQuoteFavorite: QuoteFavorite;
  updateProfile: ProfileUpdate;
};

function throwIfFailed(response: {
  status: number;
  body: { message: string };
}): void {
  if (response.status !== 200) throw new Error(response.body.message);
}

/**
 * Applies `patch` optimistically; on success writes it to the synced row (the
 * request may return changed values), on failure TanStack drops it. Direct
 * writes made meanwhile are kept either way.
 */
function userAction<T>(
  patch: (user: Snapshot, vars: T) => Partial<Snapshot>,
  request: (vars: T) => Promise<T>,
): (vars: T) => Promise<void> {
  const action = createOptimisticAction<T>({
    onMutate: (vars) => {
      const user = copyRow();
      if (user === undefined) return;
      const changes = patch(user, vars);
      userCollection.update(user.uid, (draft) => {
        Object.assign(draft, changes);
      });
    },
    mutationFn: async (vars) => {
      const kept = await request(vars);
      const user = copyRow();
      if (user === undefined) return;
      await userCollection.utils.writeUpdate({
        uid: user.uid,
        ...patch(user, kept),
      });
    },
  });
  return async (vars) => {
    if (getUser() === undefined) throw new Error("Not signed in");
    await action(vars).when("settled");
  };
}

const actions = {
  updateName: userAction<ActionType["updateName"]>(
    (_, { name }) => ({ name }),
    async (vars) => {
      throwIfFailed(await Ape.users.updateName({ body: { name: vars.name } }));
      return vars;
    },
  ),
  unlinkDiscord: userAction<ActionType["unlinkDiscord"]>(
    () => ({ discordId: undefined, discordAvatar: undefined }),
    async (vars) => {
      throwIfFailed(await Ape.users.unlinkDiscord());
      return vars;
    },
  ),
  setStreakHourOffset: userAction<ActionType["setStreakHourOffset"]>(
    (_, { hourOffset }) => ({ streakHourOffset: hourOffset }),
    async (vars) => {
      throwIfFailed(await Ape.users.setStreakHourOffset({ body: vars }));
      return vars;
    },
  ),
  rateQuote: userAction<ActionType["rateQuote"]>(
    (user, { language, quoteId, rating }) => {
      const ratings = user.quoteRatings ?? {};
      ratings[language] = { ...ratings[language], [quoteId]: rating };
      return { quoteRatings: ratings };
    },
    async (vars) => {
      throwIfFailed(await Ape.quotes.addRating({ body: vars }));
      return vars;
    },
  ),
  setQuoteFavorite: userAction<ActionType["setQuoteFavorite"]>(
    (user, { language, quoteId, favorite }) => {
      const list = user.favoriteQuotes?.[language] ?? [];
      const without = list.filter((id) => id !== quoteId);
      return {
        favoriteQuotes: {
          ...user.favoriteQuotes,
          [language]: favorite ? [...without, quoteId] : without,
        },
      };
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
  ),
  updateProfile: userAction<ActionType["updateProfile"]>(
    (user, { details, selectedBadgeId }) => ({
      details,
      ...(user.inventory !== undefined && {
        inventory: {
          ...user.inventory,
          badges: user.inventory.badges.map((badge) => ({
            ...badge,
            selected: badge.id === selectedBadgeId,
          })),
        },
      }),
    }),
    async (update) => {
      const response = await Ape.users.updateProfile({
        body: { ...update.details, selectedBadgeId: update.selectedBadgeId },
      });
      if (response.status !== 200) throw new Error(response.body.message);
      // the server sanitizes the details
      return { ...update, details: response.body.data ?? update.details };
    },
  ),
};

export async function updateName(name: string): Promise<void> {
  await actions.updateName({ name });
}

export async function unlinkDiscord(): Promise<void> {
  await actions.unlinkDiscord({});
}

export async function setStreakHourOffset(hourOffset: number): Promise<void> {
  await actions.setStreakHourOffset({ hourOffset });
}

export async function rateQuote(rating: QuoteRating): Promise<void> {
  await actions.rateQuote(rating);
}

export async function setQuoteFavorite(favorite: QuoteFavorite): Promise<void> {
  await actions.setQuoteFavorite(favorite);
}

export async function updateProfile(update: ProfileUpdate): Promise<void> {
  await actions.updateProfile(update);
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
    if (user !== undefined) void userCollection.utils.writeInsert(user);
  },
};
