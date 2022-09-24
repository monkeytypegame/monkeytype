import request from "supertest";
import app from "../../../src/app";
import * as Configuration from "../../../src/init/configuration";

const mockApp = request(app);

describe("user controller test", () => {
  describe("user creation flow", () => {
    it("should be able to check name, sign up, and get user data", async () => {
      await mockApp
        .get("/users/checkName/NewUser")
        .set({
          Accept: "application/json",
        })
        .expect(200);

      const newUser = {
        name: "NewUser",
        uid: "123456789",
        email: "newuser@mail.com",
        captcha: "captcha",
      };

      jest.spyOn(Configuration, "getCachedConfiguration").mockResolvedValue({
        //if stuff breaks this might be the reason
        users: {
          signUp: true,
          discordIntegration: {
            enabled: false,
          },
          autoBan: {
            enabled: false,
            maxCount: 5,
            maxHours: 1,
          },
          profiles: {
            enabled: false,
          },
          xp: {
            enabled: false,
            gainMultiplier: 0,
            maxDailyBonus: 0,
            minDailyBonus: 0,
            streak: {
              enabled: false,
              maxStreakDays: 0,
              maxStreakMultiplier: 0,
            },
          },
          inbox: {
            enabled: false,
            maxMail: 0,
          },
        },
      } as any);

      await mockApp
        .post("/users/signup")
        .send(newUser)
        .set({
          Accept: "application/json",
        })
        .expect(200);

      const response = await mockApp
        .get("/users")
        .send({
          uid: "123456789",
        })
        .set({
          Accept: "application/json",
        })
        .expect(200);

      const {
        body: { data: userData },
      } = response;

      expect(userData.name).toBe(newUser.name);
      expect(userData.email).toBe(newUser.email);
      expect(userData.uid).toBe(newUser.uid);

      await mockApp
        .get("/users/checkName/NewUser")
        .set({
          Accept: "application/json",
        })
        .expect(409);

      jest.restoreAllMocks();
    });
  });
});
