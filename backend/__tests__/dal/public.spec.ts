import * as PublicDAL from "../../src/dal/public";
import * as db from "../../src/init/db";
import { ObjectId } from "mongodb";

const mockSpeedHistogram = {
  _id: new ObjectId(),
  type: "speedStats",
  english_time_15: {
    "70": 2761,
    "80": 2520,
    "90": 2391,
    "100": 2317,
  },
  english_time_60: {
    "50": 8781,
    "60": 2978,
    "70": 2786,
    "80": 2572,
    "90": 2399,
  },
};

describe("PublicDAL", function () {
  it("should be able to update stats", async function () {
    // checks it doesn't throw an error. the actual values are checked in another test.
    await PublicDAL.updateStats(1, 15);
  });

  it("should be able to get typing stats", async function () {
    const typingStats = await PublicDAL.getTypingStats();
    expect(typingStats).toHaveProperty("testsCompleted");
    expect(typingStats).toHaveProperty("testsStarted");
    expect(typingStats).toHaveProperty("timeTyping");
  });

  it("should increment stats on update", async function () {
    // checks that both functions are working on the same data in mongo
    const priorStats = await PublicDAL.getTypingStats();
    await PublicDAL.updateStats(1, 60);
    const afterStats = await PublicDAL.getTypingStats();
    expect(afterStats.testsCompleted).toBe(priorStats.testsCompleted + 1);
    expect(afterStats.testsStarted).toBe(priorStats.testsStarted + 2);
    expect(afterStats.timeTyping).toBe(priorStats.timeTyping + 60);
  });

  it("should be able to get speed histogram", async function () {
    // this test ensures that the property access is correct
    await db
      .collection("public")
      .replaceOne({ type: "speedStats" }, mockSpeedHistogram, { upsert: true });
    const speedHistogram = await PublicDAL.getSpeedHistogram(
      "english",
      "time",
      "60"
    );
    expect(speedHistogram["50"]).toBe(8781); // check a value in the histogram that has been set
  });
});
