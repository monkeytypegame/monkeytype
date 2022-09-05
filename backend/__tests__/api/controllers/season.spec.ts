import request from "supertest";
import app from "../../../src/app";
import * as Configuration from "../../../src/init/configuration";

const mockApp = request(app);

describe("season controller test", () => {
  it("GET /seasons/weekly", async () => {
    const configSpy = jest
      .spyOn(Configuration, "getCachedConfiguration")
      .mockResolvedValue({
        seasons: {
          weekly: {
            enabled: true,
            expirationTimeInDays: 15,
            maxXpReward: 0,
            minXpReward: 0,
          },
        },
      } as any);

    const response = await mockApp
      .get("/seasons/weekly")
      .set({
        Accept: "application/json",
      })
      .expect(200);

    expect(response.body).toEqual({
      message: "Weekly season retrieved",
      data: [],
    });

    configSpy.mockRestore();
  });
});
