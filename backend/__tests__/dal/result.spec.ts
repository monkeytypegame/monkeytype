import * as ResultDal from "../../src/dal/result";
import { ObjectId } from "mongodb";
import * as UserDal from "../../src/dal/user";

let uid: string = "";
const timestamp = Date.now() - 60000;

async function createDummyData(
  uid: string,
  count: number,
  timestamp: number,
  tag?: string
): Promise<void> {
  const dummyUser: MonkeyTypes.DBUser = {
    _id: new ObjectId(),
    uid,
    addedAt: 0,
    email: "test@example.com",
    name: "Bob",
    personalBests: {
      time: {},
      words: {},
      quote: {},
      custom: {},
      zen: {},
    },
  };

  vi.spyOn(UserDal, "getUser").mockResolvedValue(dummyUser);
  const tags: string[] = [];
  if (tag !== undefined) tags.push(tag);
  for (let i = 0; i < count; i++) {
    await ResultDal.addResult(uid, {
      _id: new ObjectId(),
      wpm: i,
      rawWpm: i,
      charStats: [0, 0, 0, 0],
      acc: 0,
      mode: "time",
      mode2: "10" as never,
      quoteLength: 1,
      timestamp,
      restartCount: 0,
      incompleteTestSeconds: 0,
      incompleteTests: [],
      testDuration: 10,
      afkDuration: 0,
      tags,
      consistency: 100,
      keyConsistency: 100,
      chartData: { wpm: [], raw: [], err: [] },
      uid,
      keySpacingStats: { average: 0, sd: 0 },
      keyDurationStats: { average: 0, sd: 0 },
      difficulty: "normal",
      language: "english",
      isPb: false,
      name: "Test",
    } as MonkeyTypes.DBResult);
  }
}
describe("ResultDal", () => {
  describe("getResults", () => {
    beforeEach(() => {
      uid = new ObjectId().toHexString();
    });
    afterEach(async () => {
      if (uid) await ResultDal.deleteAll(uid);
    });

    it("should read lastest 10 results ordered by timestamp", async () => {
      //GIVEN
      await createDummyData(uid, 10, timestamp - 2000, "old");
      await createDummyData(uid, 20, timestamp, "current");

      //WHEN
      const results = await ResultDal.getResults(uid, { limit: 10 });

      //THEN
      expect(results).toHaveLength(10);
      let last = results[0]?.timestamp as number;
      results.forEach((it) => {
        expect(it.tags).toContain("current");
        expect(it.timestamp).toBeGreaterThanOrEqual(last);
        last = it.timestamp;
      });
    });
    it("should read all if not limited", async () => {
      //GIVEN
      await createDummyData(uid, 10, timestamp - 2000, "old");
      await createDummyData(uid, 20, timestamp, "current");

      //WHEN
      const results = await ResultDal.getResults(uid, {});

      //THEN
      expect(results).toHaveLength(30);
    });
    it("should read results onOrAfterTimestamp", async () => {
      //GIVEN
      await createDummyData(uid, 10, timestamp - 2000, "old");
      await createDummyData(uid, 20, timestamp, "current");

      //WHEN
      const results = await ResultDal.getResults(uid, {
        onOrAfterTimestamp: timestamp,
      });

      //THEN
      expect(results).toHaveLength(20);
      results.forEach((it) => {
        expect(it.tags).toContain("current");
      });
    });
    it("should read next 10 results", async () => {
      //GIVEN
      await createDummyData(uid, 10, timestamp - 2000, "old");
      await createDummyData(uid, 20, timestamp, "current");

      //WHEN
      const results = await ResultDal.getResults(uid, {
        limit: 10,
        offset: 20,
      });

      //THEN
      expect(results).toHaveLength(10);
      results.forEach((it) => {
        expect(it.tags).toContain("old");
      });
    });
  });
});
