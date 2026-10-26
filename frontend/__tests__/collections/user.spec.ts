import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import Ape from "../../src/ts/ape";
import {
  __testing,
  addBadge,
  addXp,
  clearUser,
  getUser,
  loadUserData,
  recordResult,
  resetPersonalBests,
  setDiscordLink,
  setInboxUnreadSize,
  setQuoteFavorite,
  setStreak,
  updateLbMemory,
  updateName,
  updateProfile,
} from "../../src/ts/collections/user";
import {
  getDefaultSnapshot,
  Snapshot,
  SnapshotResult,
} from "../../src/ts/constants/default-snapshot";
import { setUserId } from "../../src/ts/states/core";
import { getXpBarData } from "../../src/ts/states/header";
import { SnapshotInitError } from "../../src/ts/utils/snapshot-init-error";

vi.mock(
  import("../../src/ts/ape/server-configuration"),
  async (importOriginal) => ({
    ...(await importOriginal()),
    configurationPromise: Promise.resolve(true),
  }),
);

const DAY = 24 * 60 * 60 * 1000;
const LAST_DAY = Date.UTC(2026, 9, 20, 12);

function user(overrides: Partial<Snapshot> = {}): Snapshot {
  return {
    ...getDefaultSnapshot(),
    uid: "uid1",
    name: "bob",
    testActivity: { testsByDays: [3, null, 2], lastDay: LAST_DAY },
    inventory: {
      badges: [
        { id: 1, selected: true },
        { id: 2, selected: false },
      ],
    },
    ...overrides,
  };
}

function result(
  overrides: Partial<SnapshotResult<"time">> = {},
): SnapshotResult<"time"> {
  return {
    mode: "time",
    mode2: "15",
    language: "english",
    difficulty: "normal",
    punctuation: false,
    numbers: false,
    lazyMode: false,
    wpm: 100,
    acc: 98,
    rawWpm: 105,
    consistency: 80,
    timestamp: LAST_DAY,
    testDuration: 15,
    incompleteTestSeconds: 2,
    afkDuration: 1,
    restartCount: 3,
    ...overrides,
  } as SnapshotResult<"time">;
}

function ok<T>(data: T = null as T): never {
  return { status: 200, body: { message: "ok", data } } as never;
}

function fail(message: string): never {
  return { status: 500, body: { message } } as never;
}

beforeEach(() => {
  __testing.setUser(user());
});

afterEach(() => {
  vi.restoreAllMocks();
  __testing.setUser(undefined);
});

describe("getUser", () => {
  it("returns the row without collection props", () => {
    expect(Object.keys(getUser() ?? {}).some((k) => k.startsWith("$"))).toBe(
      false,
    );
  });

  it("is undefined without a user", () => {
    clearUser();
    expect(getUser()).toBeUndefined();
  });
});

describe("loadUserData", () => {
  afterEach(() => setUserId(null));

  it("downloads the user into the row", async () => {
    clearUser();
    setUserId("uid2");
    vi.spyOn(Ape.users, "get").mockResolvedValue(
      ok({
        uid: "uid2",
        name: "alice",
        email: "a@b.c",
        addedAt: 1,
        personalBests: { time: {}, words: {} },
        timeTyping: 10,
        startedTests: 3,
        completedTests: 2,
        xp: 50,
        streak: { length: 4, maxLength: 9, hourOffset: 2 },
        testActivity: { testsByDays: [1], lastDay: LAST_DAY },
      }),
    );

    await loadUserData();

    expect(getUser()).toMatchObject({
      uid: "uid2",
      name: "alice",
      personalBests: { time: {}, words: {}, quote: {}, zen: {}, custom: {} },
      typingStats: { timeTyping: 10, startedTests: 3, completedTests: 2 },
      xp: 50,
      streak: 4,
      maxStreak: 9,
      streakHourOffset: 2,
      inboxUnreadSize: 0,
      isPremium: false,
      testActivity: { testsByDays: [1], lastDay: LAST_DAY },
    });
  });

  it("leaves no user when the download fails", async () => {
    setUserId("uid3");
    vi.spyOn(Ape.users, "get").mockResolvedValue({
      status: 429,
      body: { message: "slow down" },
    } as never);

    await expect(loadUserData()).rejects.toBeInstanceOf(SnapshotInitError);
    expect(getUser()).toBeUndefined();
  });
});

describe("direct writes", () => {
  it("records a result: typing stats, activity and pb", () => {
    recordResult(result(), { isPb: true });

    const u = getUser();
    expect(u?.typingStats).toEqual({
      timeTyping: 16,
      startedTests: 4,
      completedTests: 1,
    });
    expect(u?.testActivity?.testsByDays).toEqual([3, null, 3]);
    expect(u?.personalBests.time["15"]).toEqual([
      expect.objectContaining({ wpm: 100, raw: 105, language: "english" }),
    ]);

    recordResult(result({ wpm: 120 }), { isPb: true });
    expect(getUser()?.personalBests.time["15"]).toEqual([
      expect.objectContaining({ wpm: 120 }),
    ]);
  });

  it("records a result on a later day, padding missed days", () => {
    recordResult(result({ timestamp: LAST_DAY + 3 * DAY }), { isPb: false });

    expect(getUser()?.testActivity).toEqual({
      testsByDays: [3, null, 2, null, null, 1],
      lastDay: LAST_DAY + 3 * DAY,
    });
    expect(getUser()?.personalBests.time).toEqual({});
  });

  it("adds xp and shows it on the xp bar", () => {
    __testing.setUser(user({ xp: 10 }));
    addXp(5);

    expect(getUser()?.xp).toBe(15);
    expect(getXpBarData()).toMatchObject({ addedXp: 5, resultingXp: 15 });
  });

  it("sets the streak, raising the max streak", () => {
    __testing.setUser(user({ streak: 1, maxStreak: 2 }));
    setStreak(3);
    expect(getUser()).toMatchObject({ streak: 3, maxStreak: 3 });
    setStreak(1);
    expect(getUser()).toMatchObject({ streak: 1, maxStreak: 3 });
  });

  it("adds badges, sets inbox size, links discord, resets pbs", () => {
    recordResult(result(), { isPb: true });

    addBadge({ id: 3 });
    setInboxUnreadSize(4);
    setDiscordLink({ discordId: "d1", discordAvatar: "a1" });
    resetPersonalBests();

    expect(getUser()?.inventory?.badges.map((b) => b.id)).toEqual([1, 2, 3]);
    expect(getUser()).toMatchObject({
      inboxUnreadSize: 4,
      discordId: "d1",
      discordAvatar: "a1",
      personalBests: { time: {}, words: {}, quote: {}, zen: {}, custom: {} },
    });
  });

  it("does nothing without a user", () => {
    clearUser();
    addXp(5);
    setStreak(5);
    expect(getUser()).toBeUndefined();
  });

  it("saves lb memory, sending only a changed rank", async () => {
    const send = vi
      .spyOn(Ape.users, "updateLeaderboardMemory")
      .mockResolvedValue(ok());

    await updateLbMemory("time", "15", "english", 7, true);
    expect(getUser()?.lbMemory?.time?.["15"]?.["english"]).toBe(7);
    expect(send).toHaveBeenCalledOnce();

    await updateLbMemory("time", "15", "english", 7, true);
    expect(send).toHaveBeenCalledOnce();
  });
});

describe("optimistic actions", () => {
  it("applies at once and keeps the change on success", async () => {
    let respond = (_: unknown): void => undefined;
    vi.spyOn(Ape.users, "updateName").mockReturnValue(
      new Promise((resolve) => (respond = resolve)) as never,
    );

    const done = updateName("carl");
    expect(getUser()?.name).toBe("carl");

    respond(ok());
    await done;
    expect(getUser()?.name).toBe("carl");
  });

  it("rolls back and rejects on failure", async () => {
    vi.spyOn(Ape.users, "updateName").mockResolvedValue(fail("taken"));

    await expect(updateName("carl")).rejects.toThrow("taken");
    expect(getUser()?.name).toBe("bob");
  });

  it("keeps a direct write made while the action was pending", async () => {
    let respond = (_: unknown): void => undefined;
    vi.spyOn(Ape.users, "updateName").mockReturnValue(
      new Promise((resolve) => (respond = resolve)) as never,
    );

    const done = updateName("carl");
    addXp(5);
    respond(ok());
    await done;

    expect(getUser()).toMatchObject({ name: "carl", xp: 5 });
  });

  it("adds and removes a favourite quote", async () => {
    vi.spyOn(Ape.users, "addQuoteToFavorites").mockResolvedValue(ok());
    vi.spyOn(Ape.users, "removeQuoteFromFavorites").mockResolvedValue(ok());

    await setQuoteFavorite({
      language: "english",
      quoteId: "5",
      favorite: true,
    });
    await setQuoteFavorite({
      language: "english",
      quoteId: "6",
      favorite: true,
    });
    expect(getUser()?.favoriteQuotes?.["english"]).toEqual(["5", "6"]);

    await setQuoteFavorite({
      language: "english",
      quoteId: "5",
      favorite: false,
    });
    expect(getUser()?.favoriteQuotes?.["english"]).toEqual(["6"]);
  });

  it("updates the profile with the server's sanitized details", async () => {
    vi.spyOn(Ape.users, "updateProfile").mockResolvedValue(
      ok({ bio: "clean" }),
    );

    await updateProfile({ details: { bio: "dirty" }, selectedBadgeId: 2 });

    expect(getUser()?.details).toEqual({ bio: "clean" });
    expect(getUser()?.inventory?.badges).toEqual([
      { id: 1, selected: false },
      { id: 2, selected: true },
    ]);
  });
});
