import _ from "lodash";
import { ObjectId } from "mongodb";
import * as UserDal from "../../src/dal/user";
import * as LeaderboardsDal from "../../src/dal/leaderboards";
import * as PublicDal from "../../src/dal/public";

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
      expect(result[0]).toHaveProperty("uid", applicableUser.uid);
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
      )) as MonkeyTypes.LeaderboardEntry[];

      //THEN
      const lb = result.map((it) => _.omit(it, ["_id"]));

      expect(lb).toEqual([
        expectedLbEntry(1, rank1, "15"),
        expectedLbEntry(2, rank2, "15"),
        expectedLbEntry(3, rank3, "15"),
        expectedLbEntry(4, rank4, "15"),
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
      )) as MonkeyTypes.LeaderboardEntry[];

      //THEN
      const lb = result.map((it) => _.omit(it, ["_id"]));

      expect(lb).toEqual([
        expectedLbEntry(1, rank1, "60"),
        expectedLbEntry(2, rank2, "60"),
        expectedLbEntry(3, rank3, "60"),
        expectedLbEntry(4, rank4, "60"),
      ]);
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
  });
});

function expectedLbEntry(rank: number, user: MonkeyTypes.User, time: string) {
  const lbBest: SharedTypes.PersonalBest =
    user.lbPersonalBests?.time[time].english;

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
    badgeId: 2,
  };
}

async function createUser(
  lbPersonalBests?: MonkeyTypes.LbPersonalBests,
  userProperties?: Partial<MonkeyTypes.User>
): Promise<MonkeyTypes.User> {
  const uid = new ObjectId().toHexString();
  await UserDal.addUser("User " + uid, uid + "@example.com", uid);

  await DB.getDb()
    ?.collection<MonkeyTypes.User>("users")
    .updateOne(
      { uid },
      {
        $set: {
          timeTyping: 7200,
          discordId: "discord " + uid,
          discordAvatar: "avatar " + uid,
          inventory: {
            badges: [
              { id: 1, selected: false },
              { id: 2, selected: true },
            ],
          },
          ...userProperties,
          lbPersonalBests,
        },
      }
    );

  return await UserDal.getUser(uid, "test");
}

function lbBests(
  pb15?: SharedTypes.PersonalBest,
  pb60?: SharedTypes.PersonalBest
): MonkeyTypes.LbPersonalBests {
  const result = { time: {} };
  if (pb15) result.time["15"] = { english: pb15 };
  if (pb60) result.time["60"] = { english: pb60 };
  return result;
}

function pb(
  wpm: number,
  acc: number = 90,
  timestamp: number = 1
): SharedTypes.PersonalBest {
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
