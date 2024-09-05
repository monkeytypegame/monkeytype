import _ from "lodash";
import { ObjectId } from "mongodb";
import * as UserDal from "../../src/dal/user";
import * as LeaderboardsDal from "../../src/dal/leaderboards";
import * as PublicDal from "../../src/dal/public";
import * as Configuration from "../../src/init/configuration";
import type { DBLeaderboardEntry } from "../../src/dal/leaderboards";
import type { PersonalBest } from "@monkeytype/contracts/schemas/shared";
const configuration = Configuration.getCachedConfiguration();

import * as DB from "../../src/init/db";

describe("LeaderboardsDal", () => {
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
      const result = await LeaderboardsDal.get("time", "15", "english", 0);

      //THEN
      expect(result).toHaveLength(1);
      expect(
        (result as LeaderboardsDal.DBLeaderboardEntry[])[0]
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
      const result = (await LeaderboardsDal.get(
        "time",
        "15",
        "english",
        0
      )) as DBLeaderboardEntry[];

      //THEN
      const lb = result.map((it) => _.omit(it, ["_id"]));

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
      const result = (await LeaderboardsDal.get(
        "time",
        "60",
        "english",
        0
      )) as LeaderboardsDal.DBLeaderboardEntry[];

      //THEN
      const lb = result.map((it) => _.omit(it, ["_id"]));

      expect(lb).toEqual([
        expectedLbEntry("60", { rank: 1, user: rank1 }),
        expectedLbEntry("60", { rank: 2, user: rank2 }),
        expectedLbEntry("60", { rank: 3, user: rank3 }),
        expectedLbEntry("60", { rank: 4, user: rank4 }),
      ]);
    });
    it("should not include discord properties for users without discord connection", async () => {
      //GIVEN
      const rank1 = await createUser(lbBests(pb(90), pb(100, 90, 2)), {
        discordId: undefined,
        discordAvatar: undefined,
      });

      //WHEN
      await LeaderboardsDal.update("time", "60", "english");
      const lb = (await LeaderboardsDal.get(
        "time",
        "60",
        "english",
        0
      )) as DBLeaderboardEntry[];

      //THEN
      expect(lb[0]).not.toHaveProperty("discordId");
      expect(lb[0]).not.toHaveProperty("discordAvatar");
    });

    it("should remove consistency from results if null", async () => {
      //GIVEN
      const stats = pb(100, 90, 2);
      //@ts-ignore
      stats["consistency"] = undefined;

      await createUser(lbBests(stats));

      //WHEN
      //WHEN
      await LeaderboardsDal.update("time", "15", "english");
      const lb = (await LeaderboardsDal.get(
        "time",
        "15",
        "english",
        0
      )) as DBLeaderboardEntry[];

      //THEN
      expect(lb[0]).not.toHaveProperty("consistency");
    });

    it("should update public speedHistogram for time english 15", async () => {
      //GIVEN
      const rank1 = await createUser(lbBests(pb(10), pb(60)));
      const rank2 = await createUser(lbBests(pb(24)));
      const rank3 = await createUser(lbBests(pb(28)));
      const rank4 = await createUser(lbBests(pb(31)));

      //WHEN
      await LeaderboardsDal.update("time", "15", "english");
      const result = await PublicDal.getSpeedHistogram("english", "time", "15");

      //THEN
      expect(result).toEqual({ "10": 1, "20": 2, "30": 1 });
    });

    it("should update public speedHistogram for time english 60", async () => {
      //GIVEN
      const rank1 = await createUser(lbBests(pb(60), pb(20)));
      const rank2 = await createUser(lbBests(undefined, pb(21)));
      const rank3 = await createUser(lbBests(undefined, pb(110)));
      const rank4 = await createUser(lbBests(undefined, pb(115)));

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
        0
      )) as DBLeaderboardEntry[];

      //THEN
      const lb = result.map((it) => _.omit(it, ["_id"]));

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
      await enablePremiumFeatures(true);
      //GIVEN
      const noPremium = await createUser(lbBests(pb(4)));
      const lifetime = await createUser(lbBests(pb(3)), premium(-1));
      const validPremium = await createUser(lbBests(pb(2)), premium(10));
      const expiredPremium = await createUser(lbBests(pb(1)), premium(-10));

      //WHEN
      await LeaderboardsDal.update("time", "15", "english");
      const result = (await LeaderboardsDal.get(
        "time",
        "15",
        "english",
        0
      )) as DBLeaderboardEntry[];

      //THEN
      const lb = result.map((it) => _.omit(it, ["_id"]));

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
      await enablePremiumFeatures(false);
      //GIVEN
      const lifetime = await createUser(lbBests(pb(3)), premium(-1));

      //WHEN
      await LeaderboardsDal.update("time", "15", "english");
      const result = (await LeaderboardsDal.get(
        "time",
        "15",
        "english",
        0
      )) as DBLeaderboardEntry[];

      //THEN
      expect(result[0]?.isPremium).toBeUndefined();
    });
  });
});

function expectedLbEntry(
  time: string,
  { rank, user, badgeId, isPremium }: ExpectedLbEntry
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
  };
}

async function createUser(
  lbPersonalBests?: MonkeyTypes.LbPersonalBests,
  userProperties?: Partial<MonkeyTypes.DBUser>
): Promise<MonkeyTypes.DBUser> {
  const uid = new ObjectId().toHexString();
  await UserDal.addUser("User " + uid, uid + "@example.com", uid);

  await DB.getDb()
    ?.collection<MonkeyTypes.DBUser>("users")
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
      }
    );

  return await UserDal.getUser(uid, "test");
}

function lbBests(
  pb15?: PersonalBest,
  pb60?: PersonalBest
): MonkeyTypes.LbPersonalBests {
  const result: MonkeyTypes.LbPersonalBests = { time: {} };
  if (pb15) result.time["15"] = { english: pb15 };
  if (pb60) result.time["60"] = { english: pb60 };
  return result;
}

export function pb(
  wpm: number,
  acc: number = 90,
  timestamp: number = 1
): PersonalBest {
  return {
    acc,
    consistency: 100,
    difficulty: "normal",
    lazyMode: false,
    language: "english",
    punctuation: false,
    raw: wpm + 1,
    wpm,
    timestamp,
  };
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

interface ExpectedLbEntry {
  rank: number;
  user: MonkeyTypes.DBUser;
  badgeId?: number;
  isPremium?: boolean;
}

async function enablePremiumFeatures(premium: boolean): Promise<void> {
  const mockConfig = _.merge(await configuration, {
    users: { premium: { enabled: premium } },
  });

  vi.spyOn(Configuration, "getCachedConfiguration").mockResolvedValue(
    mockConfig
  );
}
