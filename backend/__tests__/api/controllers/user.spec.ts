import request from "supertest";
import app from "../../../src/app";
import * as Configuration from "../../../src/init/configuration";
import { getCurrentTestActivity } from "../../../src/api/controllers/user";
import * as UserDal from "../../../src/dal/user";

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

      vi.spyOn(Configuration, "getCachedConfiguration").mockResolvedValue({
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
          premium: {
            enabled: true,
          },
        },
      } as any);

      await mockApp
        .post("/users/signup")
        .set("authorization", "Uid 123456789|newuser@mail.com")
        .send(newUser)
        .set({
          Accept: "application/json",
        })
        .expect(200);

      const response = await mockApp
        .get("/users")
        .set("authorization", "Uid 123456789")
        .send()
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

      vi.restoreAllMocks();
    });
  });

  describe("getTestActivity", () => {
    it("gets", async () => {
      //given
      vi.spyOn(UserDal, "getUser").mockResolvedValue({
        testActivity: { "2023": [1, 2, 3], "2024": [4, 5, 6] },
      } as unknown as MonkeyTypes.DBUser);

      //when
      const response = await mockApp
        .get("/users/testActivity")
        .set("authorization", "Uid 123456789")
        .send()
        .expect(200);

      //%hen
      const result = response.body.data;
      expect(result["2023"]).toEqual([1, 2, 3]);
      expect(result["2024"]).toEqual([4, 5, 6]);
    });
  });

  describe("getCurrentTestActivity", () => {
    beforeAll(() => {
      vi.useFakeTimers().setSystemTime(1712102400000);
    });
    it("without any data", () => {
      expect(getCurrentTestActivity(undefined)).toBeUndefined();
    });
    it("with current year only", () => {
      //given
      const data = {
        "2024": fillYearWithDay(94).map((it) => 2024000 + it),
      };

      //when
      const testActivity = getCurrentTestActivity(data);

      //then
      expect(testActivity?.lastDay).toEqual(1712102400000);

      const testsByDays = testActivity?.testsByDays ?? [];
      expect(testsByDays).toHaveLength(366);
      expect(testsByDays[0]).toEqual(undefined); //2023-04-04
      expect(testsByDays[271]).toEqual(undefined); //2023-12-31
      expect(testsByDays[272]).toEqual(2024001); //2024-01-01
      expect(testsByDays[365]).toEqual(2024094); //2024-01
    });
    it("with current and last year", () => {
      //given
      const data = {
        "2023": fillYearWithDay(365).map((it) => 2023000 + it),
        "2024": fillYearWithDay(94).map((it) => 2024000 + it),
      };

      //when
      const testActivity = getCurrentTestActivity(data);

      //then
      expect(testActivity?.lastDay).toEqual(1712102400000);

      const testsByDays = testActivity?.testsByDays ?? [];
      expect(testsByDays).toHaveLength(366);
      expect(testsByDays[0]).toEqual(2023094); //2023-04-04
      expect(testsByDays[271]).toEqual(2023365); //2023-12-31
      expect(testsByDays[272]).toEqual(2024001); //2024-01-01
      expect(testsByDays[365]).toEqual(2024094); //2024-01
    });
    it("with current and missing days of last year", () => {
      //given
      const data = {
        "2023": fillYearWithDay(20).map((it) => 2023000 + it),
        "2024": fillYearWithDay(94).map((it) => 2024000 + it),
      };

      //when
      const testActivity = getCurrentTestActivity(data);

      //then
      expect(testActivity?.lastDay).toEqual(1712102400000);

      const testsByDays = testActivity?.testsByDays ?? [];
      expect(testsByDays).toHaveLength(366);
      expect(testsByDays[0]).toEqual(undefined); //2023-04-04
      expect(testsByDays[271]).toEqual(undefined); //2023-12-31
      expect(testsByDays[272]).toEqual(2024001); //2024-01-01
      expect(testsByDays[365]).toEqual(2024094); //2024-01
    });
  });
});

function fillYearWithDay(days: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < days; i++) {
    result.push(i + 1);
  }
  return result;
}
