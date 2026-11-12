import { fetchUserFromApi } from "../ape/user";
import { UserData } from "../constants/user-data";
import { UserDataLoadError } from "../utils/user-data-load-error";
import { DeepReadonly } from "../utils/types";
import { baseKey } from "./utils/keys";
import { createSessionQuery } from "./utils/session-query";

/** The cached user. Readonly: writes go through `userQuery.update`. */
export type CachedUser = DeepReadonly<UserData>;

/**
 * The signed-in user's query: the auth flow downloads it, sign-out resets it
 * (with every `["user", ...]` query). The user's own module (`states/user`)
 * is the only writer.
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
