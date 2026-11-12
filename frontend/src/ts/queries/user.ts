import { Language } from "@monkeytype/schemas/languages";
import { UserProfileDetails } from "@monkeytype/schemas/users";
import { Result } from "@monkeytype/util/trycatch";

import Ape from "../ape";
import { fetchUserFromApi } from "../ape/user";
import { UserData } from "../constants/user-data";
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
 * (with every `["user", ...]` query). Written only by the optimistic actions
 * below and the direct writes in `states/user`.
 */
export const userQuery = createSessionQuery<UserData>({
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
