import {
  hashKey,
  MutationObserver,
  replaceEqualDeep,
  type MutationObserverOptions,
  useQuery,
  type UseQueryResult,
} from "@tanstack/solid-query";
import { Result } from "@monkeytype/util/trycatch";

import { queryClient } from ".";
import { fetchUserFromApi } from "../ape/user";
import { UserData } from "../constants/user-data";
import { createTrigger } from "../hooks/createTrigger";
import { UserDataLoadError } from "../utils/user-data-load-error";
import { DeepReadonly } from "../utils/types";
import { baseKey } from "./utils/keys";

/**
 * The signed-in user's query: the auth flow downloads it, sign-out resets it
 * (with every `["user", ...]` query). The user's own module (`states/user`)
 * is the only writer.
 */
const userQueryKey = baseKey("data", { isUserSpecific: true });

queryClient.setQueryDefaults(userQueryKey, {
  // session data: never stale, never collected; only the auth flow fetches
  staleTime: Infinity,
  gcTime: Infinity,
  retry: false,
});

/** The cached user. Readonly: writes go through `updateCachedUser`. */
export type CachedUser = DeepReadonly<UserData>;

function peek(): CachedUser | undefined {
  return queryClient.getQueryData<CachedUser>(userQueryKey);
}

// --- Reads ---

/**
 * Re-runs `getCachedUser()` readers when the cached user changes: at once
 * after this module's writes, and from the cache listener for other changes
 * (fetch, reset), which Query notifies a tick later. Readers re-run on any
 * change; `updateCachedUser` keeps the unchanged parts' identity, so memos and
 * `For` over a part that didn't change don't re-render.
 */
const [trackUser, triggerUser] = createTrigger();
let lastSeen: CachedUser | undefined;

function notifyIfChanged(): void {
  const user = peek();
  if (user === lastSeen) return;
  lastSeen = user;
  triggerUser();
}

const userQueryHash = hashKey(userQueryKey);
queryClient.getQueryCache().subscribe((event) => {
  if (event.query.queryHash === userQueryHash) notifyIfChanged();
});

/**
 * The cached user, `undefined` while signed out, loading or after a failed
 * load. Reactive inside components and effects, a plain read elsewhere.
 */
export function getCachedUser(): CachedUser | undefined {
  trackUser();
  return peek();
}

/** A mutable copy of the cached user, detached from the cache. */
export function copyCachedUser(): UserData | undefined {
  const user = peek();
  return user === undefined ? undefined : (structuredClone(user) as UserData);
}

/**
 * The user query for components that need its status (pending, error), eg.
 * with `AsyncContent`. Read-only: it never fetches (the auth flow does, so
 * the sign-out reset can't refetch it). Reading `data` while the sign-in
 * download runs suspends the nearest `Suspense`; check the status first, or
 * use `getUserData()` for plain reads.
 */
export function useUser(): UseQueryResult<CachedUser> {
  return useQuery<CachedUser>(
    () => ({ queryKey: userQueryKey, enabled: false }),
    () => queryClient,
  );
}

// --- Download and reset ---

/** Downloads the user into the cache; throws if the request fails. */
export async function downloadUser(): Promise<void> {
  await queryClient.query({
    queryKey: userQueryKey,
    queryFn: fetchUser,
    // the sign in (or retry) always downloads
    staleTime: 0,
  });
  notifyIfChanged();
}

/** Leaves no user. */
export function resetCachedUser(): void {
  void queryClient.resetQueries({ queryKey: userQueryKey, exact: true });
  notifyIfChanged();
}

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

// --- Writes ---

/** Applies `recipe` to a copy of the cached user; no-op without a user. */
export function updateCachedUser(recipe: (user: UserData) => void): void {
  if (peek() === undefined) return;
  queryClient.setQueryData<CachedUser>(userQueryKey, (user) => {
    if (user === undefined) return user;
    const next = structuredClone(user) as UserData;
    recipe(next);
    // keeps the unchanged parts' identity (and the whole user's, when nothing
    // changed); done here, since `useQuery` turns the query's own off
    return replaceEqualDeep(user, next);
  });
  notifyIfChanged();
}

/** Replaces the cached user without a download, for tests. */
export function replaceCachedUser(user: UserData | undefined): void {
  if (user === undefined) {
    resetCachedUser();
    return;
  }
  queryClient.setQueryData<CachedUser>(userQueryKey, structuredClone(user));
  notifyIfChanged();
}

// --- Optimistic mutations ---

/** What `onMutate` saw and wrote, for the rollback. */
type Rollback = {
  before: UserData;
  written: UserData;
  changed: (keyof UserData)[];
};

export type UserMutation<T> = MutationObserverOptions<T, Error, T, Rollback>;

const same = (a: unknown, b: unknown): boolean =>
  JSON.stringify(a) === JSON.stringify(b);

/**
 * A TanStack mutation that applies `recipe` with its variables at once and
 * sends `request`, which resolves to the values to keep (the server may change
 * them) or throws; the recipe is applied again with those. On failure the
 * fields the recipe changed are rolled back, except those changed again since
 * (by a direct write or another action), which keep the newer value. The
 * recipe must be idempotent.
 */
export function userMutation<T>(
  name: string,
  recipe: (user: UserData, vars: T) => void,
  request: (vars: T) => Promise<T>,
): UserMutation<T> {
  return {
    mutationKey: [...userQueryKey, name],
    mutationFn: request,
    onMutate: (vars) => {
      const before = copyCachedUser();
      if (before === undefined) throw new Error("Not signed in");
      updateCachedUser((user) => recipe(user, vars));
      const written = copyCachedUser() ?? before;
      const changed = (
        Object.keys({ ...before, ...written }) as (keyof UserData)[]
      ).filter((key) => !same(before[key], written[key]));
      return { before, written, changed };
    },
    onError: (_error, _vars, rollback) => {
      if (rollback === undefined) return;
      const { before, written, changed } = rollback;
      updateCachedUser((user) => {
        for (const key of changed) {
          if (!same(user[key], written[key])) continue;
          (user as Record<string, unknown>)[key] = before[key];
        }
      });
    },
    onSuccess: (kept) => {
      updateCachedUser((user) => recipe(user, kept));
    },
  };
}

/**
 * Runs a mutation outside a component (`useMutation` takes the same options
 * inside one). Failure is returned as `error`, never thrown, so callers see it
 * in the type.
 */
export async function runMutation<T>(
  options: UserMutation<T>,
  vars: T,
): Promise<Result<void>> {
  try {
    await new MutationObserver(queryClient, options).mutate(vars);
    return { data: undefined, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}
