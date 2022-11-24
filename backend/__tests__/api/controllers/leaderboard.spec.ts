import request from "supertest";
import app from "../../../src/app";
import * as Configuration from "../../../src/init/configuration";

const mockApp = request(app);

describe("leaderboards controller test", () => {
  it("GET /leaderboards/xp/weekly", async () => {
    const configSpy = jest
      .spyOn(Configuration, "getCachedConfiguration")
      .mockResolvedValue({
        leaderboards: {
          weeklyXp: {
            enabled: true,
            expirationTimeInDays: 15,
            xpRewardBrackets: [],
          },
        },
      } as any);

    const response = await mockApp
      .get("/leaderboards/xp/weekly")
      .set({
        Accept: "application/json",
      })
      .expect(200);

    expect(response.body).toEqual({
      message: "Weekly xp leaderboard retrieved",
      data: [],
    });

    configSpy.mockRestore();
  });
});
