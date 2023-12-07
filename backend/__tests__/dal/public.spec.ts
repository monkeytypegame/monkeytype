import * as PublicDAL from "../../src/dal/public";

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
});
