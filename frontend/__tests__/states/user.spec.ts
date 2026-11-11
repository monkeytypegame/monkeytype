import { createEffect, createRoot } from "solid-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import Ape from "../../src/ts/ape";
import {
  __testing,
  addBadge,
  addXp,
  clearUserData,
  getUserData,
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
} from "../../src/ts/states/user";
import { getDefaultUserData, UserData } from "../../src/ts/constants/user-data";
import type { NormalizedLocalResult } from "../../src/ts/collections/results";
import { setUserId } from "../../src/ts/states/core";
import { getXpBarData } from "../../src/ts/states/header";
import { UserDataLoadError } from "../../src/ts/utils/user-data-load-error";

vi.mock(
  import("../../src/ts/ape/server-configuration"),
  async (importOriginal) => ({
    ...(await importOriginal()),
    configurationPromise: Promise.resolve(true),
  }),
);

const DAY = 24 * 60 * 60 * 1000;
const LAST_DAY = Date.UTC(2026, 9, 20, 12);

function user(overrides: Partial<UserData> = {}): UserData {
  return {
    ...getDefaultUserData(),
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
  overrides: Partial<NormalizedLocalResult<"time">> = {},
): NormalizedLocalResult<"time"> {
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
  } as NormalizedLocalResult<"time">;
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

describe("getUserData", () => {
  it("is undefined without a user", () => {
    clearUserData();
    expect(getUserData()).toBeUndefined();
  });
});

describe("loadUserData", () => {
  afterEach(() => setUserId(null));

  it("downloads the user into the store", async () => {
    clearUserData();
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

    expect(getUserData()).toMatchObject({
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

    await expect(loadUserData()).rejects.toBeInstanceOf(UserDataLoadError);
    expect(getUserData()).toBeUndefined();
  });
});

describe("direct writes", () => {
  it("records a result: typing stats, activity and pb", () => {
    recordResult(result(), { isPb: true });

    const u = getUserData();
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
    expect(getUserData()?.personalBests.time["15"]).toEqual([
      expect.objectContaining({ wpm: 120 }),
    ]);
  });

  it("records a result on a later day, padding missed days", () => {
    recordResult(result({ timestamp: LAST_DAY + 3 * DAY }), { isPb: false });

    expect(getUserData()?.testActivity).toEqual({
      testsByDays: [3, null, 2, null, null, 1],
      lastDay: LAST_DAY + 3 * DAY,
    });
    expect(getUserData()?.personalBests.time).toEqual({});
  });

  it("adds xp and shows it on the xp bar", () => {
    __testing.setUser(user({ xp: 10 }));
    addXp(5);

    expect(getUserData()?.xp).toBe(15);
    expect(getXpBarData()).toMatchObject({ addedXp: 5, resultingXp: 15 });
  });

  it("sets the streak, raising the max streak", () => {
    __testing.setUser(user({ streak: 1, maxStreak: 2 }));
    setStreak(3);
    expect(getUserData()).toMatchObject({ streak: 3, maxStreak: 3 });
    setStreak(1);
    expect(getUserData()).toMatchObject({ streak: 1, maxStreak: 3 });
  });

  it("adds badges, sets inbox size, links discord, resets pbs", () => {
    recordResult(result(), { isPb: true });

    addBadge({ id: 3 });
    setInboxUnreadSize(4);
    setDiscordLink({ discordId: "d1", discordAvatar: "a1" });
    resetPersonalBests();

    expect(getUserData()?.inventory?.badges.map((b) => b.id)).toEqual([
      1, 2, 3,
    ]);
    expect(getUserData()).toMatchObject({
      inboxUnreadSize: 4,
      discordId: "d1",
      discordAvatar: "a1",
      personalBests: { time: {}, words: {}, quote: {}, zen: {}, custom: {} },
    });
  });

  it("does nothing without a user", () => {
    clearUserData();
    addXp(5);
    setStreak(5);
    expect(getUserData()).toBeUndefined();
  });

  it("saves lb memory, sending only a changed rank", async () => {
    const send = vi
      .spyOn(Ape.users, "updateLeaderboardMemory")
      .mockResolvedValue(ok());

    await updateLbMemory("time", "15", "english", 7, true);
    expect(getUserData()?.lbMemory?.time?.["15"]?.["english"]).toBe(7);
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
    expect(getUserData()?.name).toBe("carl");

    respond(ok());
    await done;
    expect(getUserData()?.name).toBe("carl");
  });

  it("rolls back and returns the error on failure", async () => {
    vi.spyOn(Ape.users, "updateName").mockResolvedValue(fail("taken"));

    expect((await updateName("carl")).error?.message).toBe("taken");
    expect(getUserData()?.name).toBe("bob");
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

    expect(getUserData()).toMatchObject({ name: "carl", xp: 5 });
  });

  it("keeps a direct write made while a failing action was pending", async () => {
    let respond = (_: unknown): void => undefined;
    vi.spyOn(Ape.users, "updateName").mockReturnValue(
      new Promise((resolve) => (respond = resolve)) as never,
    );

    const done = updateName("carl");
    addXp(5);
    respond(fail("taken"));
    expect((await done).error?.message).toBe("taken");

    expect(getUserData()).toMatchObject({ name: "bob", xp: 5 });
  });

  it("never shows the old value again on success", async () => {
    vi.spyOn(Ape.users, "updateName").mockResolvedValue(ok());
    const names: (string | undefined)[] = [];
    const dispose = createRoot((dispose) => {
      createEffect(() => names.push(getUserData()?.name));
      return dispose;
    });

    await updateName("carl");
    dispose();

    expect(names).toEqual(["bob", "carl"]);
  });

  it("keeps a newer action's change when an older one fails", async () => {
    const responses: ((_: unknown) => void)[] = [];
    vi.spyOn(Ape.users, "updateName").mockImplementation(
      () => new Promise((resolve) => responses.push(resolve)) as never,
    );

    const first = updateName("carl");
    const second = updateName("dave");
    responses[0]?.(fail("taken"));
    expect((await first).error?.message).toBe("taken");
    expect(getUserData()?.name).toBe("dave");

    responses[1]?.(ok());
    await second;
    expect(getUserData()?.name).toBe("dave");
  });

  it("keeps a newer favourite when an older one fails", async () => {
    const responses: ((_: unknown) => void)[] = [];
    vi.spyOn(Ape.users, "addQuoteToFavorites").mockImplementation(
      () => new Promise((resolve) => responses.push(resolve)) as never,
    );

    const first = setQuoteFavorite({
      language: "english",
      quoteId: "5",
      favorite: true,
    });
    const second = setQuoteFavorite({
      language: "english",
      quoteId: "6",
      favorite: true,
    });
    responses[0]?.(fail("nope"));
    expect((await first).error?.message).toBe("nope");
    responses[1]?.(ok());
    await second;

    // the failed one stays too: the list changed since, so it isn't rolled back
    expect(getUserData()?.favoriteQuotes?.["english"]).toEqual(["5", "6"]);
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
    expect(getUserData()?.favoriteQuotes?.["english"]).toEqual(["5", "6"]);

    await setQuoteFavorite({
      language: "english",
      quoteId: "5",
      favorite: false,
    });
    expect(getUserData()?.favoriteQuotes?.["english"]).toEqual(["6"]);
  });

  it("updates the profile with the server's sanitized details", async () => {
    vi.spyOn(Ape.users, "updateProfile").mockResolvedValue(
      ok({ bio: "clean" }),
    );

    await updateProfile({ details: { bio: "dirty" }, selectedBadgeId: 2 });

    expect(getUserData()?.details).toEqual({ bio: "clean" });
    expect(getUserData()?.inventory?.badges).toEqual([
      { id: 1, selected: false },
      { id: 2, selected: true },
    ]);
  });
});
