import { describe, it, expect, afterEach, vi } from "vitest";
import { ObjectId } from "mongodb";
import * as UserDal from "../../../src/dal/user";
import * as LeaderboardsDal from "../../../src/dal/leaderboards";
import * as PublicDal from "../../../src/dal/public";
import type { DBLeaderboardEntry } from "../../../src/dal/leaderboards";
import type { PersonalBest } from "@monkeytype/schemas/shared";

import * as DB from "../../../src/init/db";
import { LbPersonalBests } from "../../../src/utils/pb";

import { pb } from "../../__testData__/users";
import { createConnection } from "../../__testData__/connections";
import { omit } from "../../../src/utils/misc";

describe("LeaderboardsDal", () => {
  afterEach(async () => {
    await DB.collection("users").deleteMany({});
  });
  describe("update", () => {
    it("should ignore unapplicable users on leaderboard", async () => {
      //GIVEN
      const lbPersonalBests = lbBests(pb(100), pb(90));
      const applicableUser = await createUser(lbPersonalBests);
      await createUser(lbPersonalBests, { banned: true });
      await createUser(lbPersonalBests, { lbOptOut: true });
      await createUser(lbPersonalBests, { needsToChangeName: true });
      await createUser(lbPersonalBests, { timeTyping: 0 });
      await createUser(lbBests(pb(0, 90, 1)));
      await createUser(lbBests(pb(60, 0, 1)));
      await createUser(lbBests(pb(60, 90, 0)));
      await createUser(lbBests(undefined, pb(60)));

      //WHEN
      await LeaderboardsDal.update("time", "15", "english");
      const results = await LeaderboardsDal.get("time", "15", "english", 0, 50);

      //THEN
      expect(results).toHaveLength(1);
      expect(
        (results as LeaderboardsDal.DBLeaderboardEntry[])[0],
      ).toHaveProperty("uid", applicableUser.uid);
    });

    it("should create leaderboard time english 15", async () => {
      //GIVEN
      const rank1 = await createUser(lbBests(pb(100, 90, 2)));
      const rank2 = await createUser(lbBests(pb(100, 90, 1)));
      const rank3 = await createUser(lbBests(pb(100, 80, 2)));
      const rank4 = await createUser(lbBests(pb(90, 100, 1)));

      //WHEN
      await LeaderboardsDal.update("time", "15", "english");
      const results = (await LeaderboardsDal.get(
        "time",
        "15",
        "english",
        0,
        50,
      )) as DBLeaderboardEntry[];

      //THEN

      const lb = results.map((it) => omit(it, ["_id"]));

      expect(lb).toEqual([
        expectedLbEntry("15", { rank: 1, user: rank1 }),
        expectedLbEntry("15", { rank: 2, user: rank2 }),
        expectedLbEntry("15", { rank: 3, user: rank3 }),
        expectedLbEntry("15", { rank: 4, user: rank4 }),
      ]);
    });
    it("should create leaderboard time english 60", async () => {
      //GIVEN
      const rank1 = await createUser(lbBests(pb(90), pb(100, 90, 2)));
      const rank2 = await createUser(lbBests(undefined, pb(100, 90, 1)));
      const rank3 = await createUser(lbBests(undefined, pb(100, 80, 2)));
      const rank4 = await createUser(lbBests(undefined, pb(90, 100, 1)));

      //WHEN
      await LeaderboardsDal.update("time", "60", "english");
      const results = (await LeaderboardsDal.get(
        "time",
        "60",
        "english",
        0,
        50,
      )) as LeaderboardsDal.DBLeaderboardEntry[];

      //THEN
      const lb = results.map((it) => omit(it, ["_id"]));

      expect(lb).toEqual([
        expectedLbEntry("60", { rank: 1, user: rank1 }),
        expectedLbEntry("60", { rank: 2, user: rank2 }),
        expectedLbEntry("60", { rank: 3, user: rank3 }),
        expectedLbEntry("60", { rank: 4, user: rank4 }),
      ]);
    });
    it("should not include discord properties for users without discord connection", async () => {
      //GIVEN
      await createUser(lbBests(pb(90), pb(100, 90, 2)), {
        discordId: undefined,
        discordAvatar: undefined,
      });

      //WHEN
      await LeaderboardsDal.update("time", "60", "english");
      const lb = (await LeaderboardsDal.get(
        "time",
        "60",
        "english",
        0,
        50,
      )) as DBLeaderboardEntry[];

      //THEN
      expect(lb[0]).not.toHaveProperty("discordId");
      expect(lb[0]).not.toHaveProperty("discordAvatar");
    });

    it("should remove consistency from results if null", async () => {
      //GIVEN
      const stats = pb(100, 90, 2);
      //@ts-ignore
      stats.consistency = undefined;

      await createUser(lbBests(stats));

      //WHEN
      //WHEN
      await LeaderboardsDal.update("time", "15", "english");
      const lb = (await LeaderboardsDal.get(
        "time",
        "15",
        "english",
        0,
        50,
      )) as DBLeaderboardEntry[];

      //THEN
      expect(lb[0]).not.toHaveProperty("consistency");
    });

    it("should update public speedHistogram for time english 15", async () => {
      //GIVEN
      await createUser(lbBests(pb(10), pb(60)));
      await createUser(lbBests(pb(24)));
      await createUser(lbBests(pb(28)));
      await createUser(lbBests(pb(31)));

      //WHEN
      await LeaderboardsDal.update("time", "15", "english");
      const result = await PublicDal.getSpeedHistogram("english", "time", "15");

      //THEN
      expect(result).toEqual({ "10": 1, "20": 2, "30": 1 });
    });

    it("should update public speedHistogram for time english 60", async () => {
      //GIVEN
      await createUser(lbBests(pb(60), pb(20)));
      await createUser(lbBests(undefined, pb(21)));
      await createUser(lbBests(undefined, pb(110)));
      await createUser(lbBests(undefined, pb(115)));

      //WHEN
      await LeaderboardsDal.update("time", "60", "english");
      const result = await PublicDal.getSpeedHistogram("english", "time", "60");

      //THEN
      expect(result).toEqual({ "20": 2, "110": 2 });
    });

    it("should create leaderboard with badges", async () => {
      //GIVEN
      const noBadge = await createUser(lbBests(pb(4)));
      const oneBadgeSelected = await createUser(lbBests(pb(3)), {
        inventory: { badges: [{ id: 1, selected: true }] },
      });
      const oneBadgeNotSelected = await createUser(lbBests(pb(2)), {
        inventory: { badges: [{ id: 1, selected: false }] },
      });
      const multipleBadges = await createUser(lbBests(pb(1)), {
        inventory: {
          badges: [
            { id: 1, selected: false },
            { id: 2, selected: true },
            { id: 3, selected: true },
          ],
        },
      });

      //WHEN
      await LeaderboardsDal.update("time", "15", "english");
      const result = (await LeaderboardsDal.get(
        "time",
        "15",
        "english",
        0,
        50,
      )) as DBLeaderboardEntry[];

      //THEN
      const lb = result.map((it) => omit(it, ["_id"]));

      expect(lb).toEqual([
        expectedLbEntry("15", { rank: 1, user: noBadge }),
        expectedLbEntry("15", {
          rank: 2,
          user: oneBadgeSelected,
          badgeId: 1,
        }),
        expectedLbEntry("15", { rank: 3, user: oneBadgeNotSelected }),
        expectedLbEntry("15", {
          rank: 4,
          user: multipleBadges,
          badgeId: 2,
        }),
      ]);
    });

    it("should create leaderboard with premium", async () => {
      //GIVEN
      vi.useRealTimers(); //timestamp for premium is calculated in mongo
      const noPremium = await createUser(lbBests(pb(4)));
      const lifetime = await createUser(lbBests(pb(3)), premium(-1));
      const validPremium = await createUser(lbBests(pb(2)), premium(1000));
      const expiredPremium = await createUser(lbBests(pb(1)), premium(-10));

      //WHEN
      await LeaderboardsDal.update("time", "15", "english");

      const result = (await LeaderboardsDal.get(
        "time",
        "15",
        "english",
        0,
        50,
        true,
      )) as DBLeaderboardEntry[];

      //THEN
      const lb = result.map((it) => omit(it, ["_id"]));

      expect(lb).toEqual([
        expectedLbEntry("15", { rank: 1, user: noPremium }),
        expectedLbEntry("15", {
          rank: 2,
          user: lifetime,
          isPremium: true,
        }),
        expectedLbEntry("15", {
          rank: 3,
          user: validPremium,
          isPremium: true,
        }),
        expectedLbEntry("15", { rank: 4, user: expiredPremium }),
      ]);
    });
    it("should create leaderboard without premium if feature disabled", async () => {
      //GIVEN
      // const lifetime = await createUser(lbBests(pb(3)), premium(-1));

      //WHEN
      await LeaderboardsDal.update("time", "15", "english");
      const results = (await LeaderboardsDal.get(
        "time",
        "15",
        "english",
        0,
        50,
        false,
      )) as DBLeaderboardEntry[];

      //THEN
      expect(results[0]?.isPremium).toBeUndefined();
    });
  });

  describe("get", () => {
    it("should get for page", async () => {
      //GIVEN
      const _rank1 = await createUser(lbBests(pb(90), pb(105, 90, 2)));
      const _rank2 = await createUser(lbBests(undefined, pb(100, 90, 1)));
      const rank3 = await createUser(lbBests(undefined, pb(95, 80, 2)));
      const rank4 = await createUser(lbBests(undefined, pb(90, 100, 1)));
      await LeaderboardsDal.update("time", "60", "english");

      //WHEN

      const results = (await LeaderboardsDal.get(
        "time",
        "60",
        "english",
        1,
        2,
        true,
      )) as LeaderboardsDal.DBLeaderboardEntry[];

      //THEN
      const lb = results.map((it) => omit(it, ["_id"]));

      expect(lb).toEqual([
        expectedLbEntry("60", { rank: 3, user: rank3 }),
        expectedLbEntry("60", { rank: 4, user: rank4 }),
      ]);
    });
    it("should get for friends only", async () => {
      //GIVEN
      const rank1 = await createUser(lbBests(pb(90), pb(100, 90, 2)));
      const uid = rank1.uid;
      const _rank2 = await createUser(lbBests(undefined, pb(100, 90, 1)));
      const _rank3 = await createUser(lbBests(undefined, pb(100, 80, 2)));
      const rank4 = await createUser(lbBests(undefined, pb(90, 100, 1)));

      //two friends, one is not on the leaderboard
      await createConnection({
        initiatorUid: uid,
        receiverUid: rank4.uid,
        status: "accepted",
      });

      await createConnection({ initiatorUid: uid, status: "accepted" });

      await LeaderboardsDal.update("time", "60", "english");

      //WHEN

      const results = (await LeaderboardsDal.get(
        "time",
        "60",
        "english",
        0,
        50,
        false,
        uid,
      )) as LeaderboardsDal.DBLeaderboardEntry[];

      //THEN
      const lb = results.map((it) => omit(it, ["_id"]));

      expect(lb).toEqual([
        expectedLbEntry("60", { rank: 1, user: rank1, friendsRank: 1 }),
        expectedLbEntry("60", { rank: 4, user: rank4, friendsRank: 2 }),
      ]);
    });
    it("should get for friends only with page", async () => {
      //GIVEN
      const rank1 = await createUser(lbBests(pb(90), pb(105, 90, 2)));
      const uid = rank1.uid;
      const rank2 = await createUser(lbBests(undefined, pb(100, 90, 1)));
      const _rank3 = await createUser(lbBests(undefined, pb(95, 80, 2)));
      const rank4 = await createUser(lbBests(undefined, pb(90, 100, 1)));
      await LeaderboardsDal.update("time", "60", "english");

      await createConnection({
        initiatorUid: uid,
        receiverUid: rank2.uid,
        status: "accepted",
      });
      await createConnection({
        initiatorUid: rank4.uid,
        receiverUid: uid,
        status: "accepted",
      });

      //WHEN
      const results = (await LeaderboardsDal.get(
        "time",
        "60",
        "english",
        1,
        2,
        false,
        uid,
      )) as LeaderboardsDal.DBLeaderboardEntry[];

      //THEN
      const lb = results.map((it) => omit(it, ["_id"]));

      expect(lb).toEqual([
        expectedLbEntry("60", { rank: 4, user: rank4, friendsRank: 3 }),
      ]);
    });
    it("should return empty list if no friends", async () => {
      //GIVEN
      const uid = new ObjectId().toHexString();

      //WHEN
      const results = (await LeaderboardsDal.get(
        "time",
        "60",
        "english",
        1,
        2,
        false,
        uid,
      )) as LeaderboardsDal.DBLeaderboardEntry[];
      //THEN
      expect(results).toEqual([]);
    });
  });
  describe("getCount / getRank", () => {
    it("should get count", async () => {
      //GIVEN
      await createUser(lbBests(undefined, pb(105)), { name: "One" });
      await createUser(lbBests(undefined, pb(100)), { name: "Two" });
      const me = await createUser(lbBests(undefined, pb(95)), { name: "Me" });
      await createUser(lbBests(undefined, pb(90)), { name: "Three" });
      await LeaderboardsDal.update("time", "60", "english");

      //WHEN / THEN

      expect(await LeaderboardsDal.getCount("time", "60", "english")) //
        .toEqual(4);
      expect(await LeaderboardsDal.getRank("time", "60", "english", me.uid)) //
        .toEqual(
          expect.objectContaining({
            wpm: 95,
            rank: 3,
            name: me.name,
            uid: me.uid,
          }),
        );
    });
    it("should get for friends only", async () => {
      //GIVEN
      const friendOne = await createUser(lbBests(undefined, pb(105)));
      await createUser(lbBests(undefined, pb(100)));
      await createUser(lbBests(undefined, pb(95)));
      const friendTwo = await createUser(lbBests(undefined, pb(90)));
      const me = await createUser(lbBests(undefined, pb(99)));
      await LeaderboardsDal.update("time", "60", "english");

      await createConnection({
        initiatorUid: me.uid,
        receiverUid: friendOne.uid,
        status: "accepted",
      });

      await createConnection({
        initiatorUid: friendTwo.uid,
        receiverUid: me.uid,
        status: "accepted",
      });

      //WHEN / THEN

      expect(await LeaderboardsDal.getCount("time", "60", "english", me.uid)) //
        .toEqual(3);
      expect(
        await LeaderboardsDal.getRank("time", "60", "english", me.uid, true),
      ) //
        .toEqual(
          expect.objectContaining({
            wpm: 99,
            rank: 3,
            friendsRank: 2,
            name: me.name,
            uid: me.uid,
          }),
        );
    });
  });
});

function expectedLbEntry(
  time: string,
  { rank, user, badgeId, isPremium, friendsRank }: ExpectedLbEntry,
) {
  // @ts-expect-error
  const lbBest: PersonalBest =
    // @ts-expect-error
    user.lbPersonalBests?.time[Number.parseInt(time)].english;

  return {
    rank,
    uid: user.uid,
    name: user.name,
    wpm: lbBest.wpm,
    acc: lbBest.acc,
    timestamp: lbBest.timestamp,
    raw: lbBest.raw,
    consistency: lbBest.consistency,
    discordId: user.discordId,
    discordAvatar: user.discordAvatar,
    badgeId,
    isPremium,
    friendsRank,
  };
}

async function createUser(
  lbPersonalBests?: LbPersonalBests,
  userProperties?: Partial<UserDal.DBUser>,
): Promise<UserDal.DBUser> {
  const uid = new ObjectId().toHexString();
  await UserDal.addUser("User " + uid, uid + "@example.com", uid);

  await DB.getDb()
    ?.collection<UserDal.DBUser>("users")
    .updateOne(
      { uid },
      {
        $set: {
          timeTyping: 7200,
          discordId: "discord " + uid,
          discordAvatar: "avatar " + uid,
          ...userProperties,
          lbPersonalBests,
        },
      },
    );

  return await UserDal.getUser(uid, "test");
}

function lbBests(pb15?: PersonalBest, pb60?: PersonalBest): LbPersonalBests {
  const result: LbPersonalBests = { time: {} };
  if (pb15) result.time["15"] = { english: pb15 };
  if (pb60) result.time["60"] = { english: pb60 };
  return result;
}

function premium(expirationDeltaSeconds: number) {
  return {
    premium: {
      startTimestamp: 0,
      expirationTimestamp:
        expirationDeltaSeconds === -1
          ? -1
          : Date.now() + expirationDeltaSeconds * 1000,
    },
  };
}

type ExpectedLbEntry = {
  rank: number;
  user: UserDal.DBUser;
  badgeId?: number;
  isPremium?: boolean;
  friendsRank?: number;
};
