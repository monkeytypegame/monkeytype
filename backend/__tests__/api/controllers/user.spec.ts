import request from "supertest";
import app from "../../../src/app";
import * as Configuration from "../../../src/init/configuration";
import { generateCurrentTestActivity } from "../../../src/api/controllers/user";
import * as UserDal from "../../../src/dal/user";
import _ from "lodash";
import { DecodedIdToken } from "firebase-admin/lib/auth/token-verifier";
import * as AuthUtils from "../../../src/utils/auth";
import * as BlocklistDal from "../../../src/dal/blocklist";
import * as ApeKeys from "../../../src/dal/ape-keys";
import * as PresetDal from "../../../src/dal/preset";
import * as ConfigDal from "../../../src/dal/config";
import * as ResultDal from "../../../src/dal/result";
import * as DailyLeaderboards from "../../../src/utils/daily-leaderboards";
import GeorgeQueue from "../../../src/queues/george-queue";
import * as AdminUuids from "../../../src/dal/admin-uids";
import * as DiscordUtils from "../../../src/utils/discord";

const mockApp = request(app);
const configuration = Configuration.getCachedConfiguration();

const mockDecodedToken: DecodedIdToken = {
  uid: "123456789",
  email: "newuser@mail.com",
  iat: Date.now(),
} as DecodedIdToken;

describe("user controller test", () => {
  beforeEach(() => {
    vi.spyOn(AuthUtils, "verifyIdToken").mockResolvedValue(mockDecodedToken);
  });
  describe("user creation flow", () => {
    beforeEach(async () => {
      await enableSignup(true);
    });
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
    });
  });
  describe("user signup", () => {
    const blocklistContainsMock = vi.spyOn(BlocklistDal, "contains");
    const firebaseDeleteUserMock = vi.spyOn(AuthUtils, "deleteUser");
    const usernameAvailableMock = vi.spyOn(UserDal, "isNameAvailable");
    beforeEach(async () => {
      await enableSignup(true);
      usernameAvailableMock.mockResolvedValue(true);
    });
    afterEach(() => {
      [
        blocklistContainsMock,
        firebaseDeleteUserMock,
        usernameAvailableMock,
      ].forEach((it) => it.mockReset());
    });

    it("should not create user if blocklisted", async () => {
      //GIVEN
      blocklistContainsMock.mockResolvedValue(true);
      firebaseDeleteUserMock.mockResolvedValue();

      const newUser = {
        name: "NewUser",
        uid: "123456789",
        email: "newuser@mail.com",
        captcha: "captcha",
      };

      //WHEN
      const result = await mockApp
        .post("/users/signup")
        .set("authorization", "Uid 123456789|newuser@mail.com")
        .send(newUser)
        .set({
          Accept: "application/json",
        })
        .expect(409);

      //THEN
      expect(result.body.message).toEqual("Username or email blocked");
      expect(blocklistContainsMock).toHaveBeenCalledWith({
        name: "NewUser",
        email: "newuser@mail.com",
      });

      //user will be created in firebase from the frontend, make sure we remove it
      expect(firebaseDeleteUserMock).toHaveBeenCalledWith("123456789");
    });

    it("should not create user domain is blacklisted", async () => {
      for (const domain of ["tidal.lol", "selfbot.cc"]) {
        //GIVEN
        firebaseDeleteUserMock.mockResolvedValue();

        const newUser = {
          name: "NewUser",
          uid: "123456789",
          email: `newuser@${domain}`,
          captcha: "captcha",
        };

        //WHEN
        const result = await mockApp
          .post("/users/signup")
          .set("authorization", `Uid 123456789|newuser@${domain}`)
          .send(newUser)
          .set({
            Accept: "application/json",
          })
          .expect(400);

        //THEN
        expect(result.body.message).toEqual("Invalid domain");

        //user will be created in firebase from the frontend, make sure we remove it
        expect(firebaseDeleteUserMock).toHaveBeenCalledWith("123456789");
      }
    });

    it("should not create user if username is taken", async () => {
      //GIVEN
      usernameAvailableMock.mockResolvedValue(false);
      firebaseDeleteUserMock.mockResolvedValue();

      const newUser = {
        name: "NewUser",
        uid: "123456789",
        email: "newuser@mail.com",
        captcha: "captcha",
      };

      //WHEN
      const result = await mockApp
        .post("/users/signup")
        .set("authorization", "Uid 123456789|newuser@mail.com")
        .send(newUser)
        .set({
          Accept: "application/json",
        })
        .expect(409);

      //THEN
      expect(result.body.message).toEqual("Username unavailable");
      expect(usernameAvailableMock).toHaveBeenCalledWith(
        "NewUser",
        "123456789"
      );

      //user will be created in firebase from the frontend, make sure we remove it
      expect(firebaseDeleteUserMock).toHaveBeenCalledWith("123456789");
    });
  });
  describe("getTestActivity", () => {
    const getUserMock = vi.spyOn(UserDal, "getPartialUser");
    afterAll(() => {
      getUserMock.mockReset();
    });
    it("should return 503 for non premium users", async () => {
      //given
      getUserMock.mockResolvedValue({
        testActivity: { "2023": [1, 2, 3], "2024": [4, 5, 6] },
      } as Partial<MonkeyTypes.DBUser> as MonkeyTypes.DBUser);

      //when
      await mockApp
        .get("/users/testActivity")
        .set("authorization", "Uid 123456789")
        .send()
        .expect(503);
    });
    it("should send data for premium users", async () => {
      //given
      getUserMock.mockResolvedValue({
        testActivity: { "2023": [1, 2, 3], "2024": [4, 5, 6] },
      } as Partial<MonkeyTypes.DBUser> as MonkeyTypes.DBUser);
      vi.spyOn(UserDal, "checkIfUserIsPremium").mockResolvedValue(true);
      await enablePremiumFeatures(true);

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

  describe("generateCurrentTestActivity", () => {
    beforeAll(() => {
      vi.useFakeTimers().setSystemTime(1712102400000);
    });
    it("without any data", () => {
      expect(generateCurrentTestActivity(undefined)).toBeUndefined();
    });
    it("with current year only", () => {
      //given
      const data = {
        "2024": fillYearWithDay(94).map((it) => 2024000 + it),
      };

      //when
      const testActivity = generateCurrentTestActivity(data);

      //then
      expect(testActivity?.lastDay).toEqual(1712102400000);

      const testsByDays = testActivity?.testsByDays ?? [];
      expect(testsByDays).toHaveLength(372);
      expect(testsByDays[6]).toEqual(undefined); //2023-04-04
      expect(testsByDays[277]).toEqual(undefined); //2023-12-31
      expect(testsByDays[278]).toEqual(2024001); //2024-01-01
      expect(testsByDays[371]).toEqual(2024094); //2024-01
    });
    it("with current and last year", () => {
      //given
      const data = {
        "2023": fillYearWithDay(365).map((it) => 2023000 + it),
        "2024": fillYearWithDay(94).map((it) => 2024000 + it),
      };

      //when
      const testActivity = generateCurrentTestActivity(data);

      //then
      expect(testActivity?.lastDay).toEqual(1712102400000);

      const testsByDays = testActivity?.testsByDays ?? [];
      expect(testsByDays).toHaveLength(372);
      expect(testsByDays[6]).toEqual(2023094); //2023-04-04
      expect(testsByDays[277]).toEqual(2023365); //2023-12-31
      expect(testsByDays[278]).toEqual(2024001); //2024-01-01
      expect(testsByDays[371]).toEqual(2024094); //2024-01
    });
    it("with current and missing days of last year", () => {
      //given
      const data = {
        "2023": fillYearWithDay(20).map((it) => 2023000 + it),
        "2024": fillYearWithDay(94).map((it) => 2024000 + it),
      };

      //when
      const testActivity = generateCurrentTestActivity(data);

      //then
      expect(testActivity?.lastDay).toEqual(1712102400000);

      const testsByDays = testActivity?.testsByDays ?? [];
      expect(testsByDays).toHaveLength(372);
      expect(testsByDays[6]).toEqual(undefined); //2023-04-04
      expect(testsByDays[277]).toEqual(undefined); //2023-12-31
      expect(testsByDays[278]).toEqual(2024001); //2024-01-01
      expect(testsByDays[371]).toEqual(2024094); //2024-01
    });
  });

  describe("toggle ban", () => {
    const getUserMock = vi.spyOn(UserDal, "getPartialUser");
    const setBannedMock = vi.spyOn(UserDal, "setBanned");
    const georgeUserBannedMock = vi.spyOn(GeorgeQueue, "userBanned");
    const isAdminMock = vi.spyOn(AdminUuids, "isAdmin");
    beforeEach(async () => {
      await enableAdminFeatures(true);

      isAdminMock.mockResolvedValue(true);
    });
    afterEach(() => {
      [getUserMock, setBannedMock, georgeUserBannedMock, isAdminMock].forEach(
        (it) => it.mockReset()
      );
    });

    it("bans user with discord", async () => {
      //GIVEN
      const uid = "myUid";
      const user = {
        uid,
        name: "name",
        email: "email",
        discordId: "discordId",
      } as Partial<MonkeyTypes.DBUser> as MonkeyTypes.DBUser;
      getUserMock.mockResolvedValue(user);

      //WHEN
      await mockApp
        .post("/admin/toggleBan")
        .set("Authorization", "Bearer 123456789")
        .send({ uid })
        .set({
          Accept: "application/json",
        })
        .expect(200);

      //THEN
      expect(getUserMock).toHaveBeenLastCalledWith(uid, "toggle ban", [
        "banned",
        "discordId",
      ]);
      expect(setBannedMock).toHaveBeenCalledWith(uid, true);
      expect(georgeUserBannedMock).toHaveBeenCalledWith("discordId", true);
    });
    it("bans user without discord", async () => {
      //GIVEN
      const uid = "myUid";
      const user = {
        uid,
        name: "name",
        email: "email",
        discordId: "",
      } as Partial<MonkeyTypes.DBUser> as MonkeyTypes.DBUser;
      getUserMock.mockResolvedValue(user);

      //WHEN
      await mockApp
        .post("/admin/toggleBan")
        .set("Authorization", "Bearer 123456789")
        .send({ uid })
        .set({
          Accept: "application/json",
        })
        .expect(200);

      //THEN
      expect(georgeUserBannedMock).not.toHaveBeenCalled();
    });
    it("unbans user with discord", async () => {
      //GIVEN
      const uid = "myUid";

      const user = {
        uid,
        name: "name",
        email: "email",
        discordId: "discordId",
        banned: true,
      } as Partial<MonkeyTypes.DBUser> as MonkeyTypes.DBUser;
      getUserMock.mockResolvedValue(user);

      //WHEN
      await mockApp
        .post("/admin/toggleBan")
        .set("Authorization", "Bearer 123456789")
        .send({ uid })
        .set({
          Accept: "application/json",
        })
        .expect(200);

      //THEN
      expect(getUserMock).toHaveBeenLastCalledWith(uid, "toggle ban", [
        "banned",
        "discordId",
      ]);
      expect(setBannedMock).toHaveBeenCalledWith(uid, false);
      expect(georgeUserBannedMock).toHaveBeenCalledWith("discordId", false);
    });
    it("unbans user without discord", async () => {
      //GIVEN
      const uid = "myUid";

      const user = {
        uid,
        name: "name",
        email: "email",
        discordId: "",
        banned: true,
      } as Partial<MonkeyTypes.DBUser> as MonkeyTypes.DBUser;
      getUserMock.mockResolvedValue(user);

      //WHEN
      await mockApp
        .post("/admin/toggleBan")
        .set("Authorization", "Bearer 123456789")
        .send({ uid })
        .set({
          Accept: "application/json",
        })
        .expect(200);

      //THEN
      expect(georgeUserBannedMock).not.toHaveBeenCalled();
    });
  });

  describe("delete user", () => {
    const getUserMock = vi.spyOn(UserDal, "getPartialUser");
    const deleteUserMock = vi.spyOn(UserDal, "deleteUser");
    const firebaseDeleteUserMock = vi.spyOn(AuthUtils, "deleteUser");
    const deleteAllApeKeysMock = vi.spyOn(ApeKeys, "deleteAllApeKeys");
    const deleteAllPresetsMock = vi.spyOn(PresetDal, "deleteAllPresets");
    const deleteConfigMock = vi.spyOn(ConfigDal, "deleteConfig");
    const deleteAllResultMock = vi.spyOn(ResultDal, "deleteAll");
    const purgeUserFromDailyLeaderboardsMock = vi.spyOn(
      DailyLeaderboards,
      "purgeUserFromDailyLeaderboards"
    );
    const blocklistAddMock = vi.spyOn(BlocklistDal, "add");

    beforeEach(() => {
      [
        firebaseDeleteUserMock,
        deleteUserMock,
        blocklistAddMock,
        deleteAllApeKeysMock,
        deleteAllPresetsMock,
        deleteConfigMock,
        purgeUserFromDailyLeaderboardsMock,
      ].forEach((it) => it.mockResolvedValue(undefined));

      deleteAllResultMock.mockResolvedValue({} as any);
    });

    afterEach(() => {
      [
        getUserMock,
        deleteUserMock,
        blocklistAddMock,
        firebaseDeleteUserMock,
        deleteConfigMock,
        deleteAllResultMock,
        deleteAllApeKeysMock,
        deleteAllPresetsMock,
        purgeUserFromDailyLeaderboardsMock,
      ].forEach((it) => it.mockReset());
    });

    it("should add user to blocklist if banned", async () => {
      //GIVEN
      const uid = mockDecodedToken.uid;
      const user = {
        uid,
        name: "name",
        email: "email",
        discordId: "discordId",
        banned: true,
      } as Partial<MonkeyTypes.DBUser> as MonkeyTypes.DBUser;
      await getUserMock.mockResolvedValue(user);

      //WHEN
      await mockApp
        .delete("/users/")
        .set("Authorization", "Bearer 123456789")
        .set({
          Accept: "application/json",
        })
        .expect(200);

      //THEN
      expect(blocklistAddMock).toHaveBeenCalledWith(user);

      expect(deleteUserMock).toHaveBeenCalledWith(uid);
      expect(firebaseDeleteUserMock).toHaveBeenCalledWith(uid);
      expect(deleteAllApeKeysMock).toHaveBeenCalledWith(uid);
      expect(deleteAllPresetsMock).toHaveBeenCalledWith(uid);
      expect(deleteConfigMock).toHaveBeenCalledWith(uid);
      expect(deleteAllResultMock).toHaveBeenCalledWith(uid);
      expect(purgeUserFromDailyLeaderboardsMock).toHaveBeenCalledWith(
        uid,
        (await configuration).dailyLeaderboards
      );
    });
    it("should delete user without adding to blocklist if not banned", async () => {
      //GIVEN
      const uid = mockDecodedToken.uid;
      const user = {
        uid,
        name: "name",
        email: "email",
        discordId: "discordId",
      } as Partial<MonkeyTypes.DBUser> as MonkeyTypes.DBUser;
      getUserMock.mockResolvedValue(user);

      //WHEN
      await mockApp
        .delete("/users/")
        .set("Authorization", "Bearer 123456789")
        .set({
          Accept: "application/json",
        })
        .expect(200);

      //THEN
      expect(blocklistAddMock).not.toHaveBeenCalled();

      expect(deleteUserMock).toHaveBeenCalledWith(uid);
      expect(firebaseDeleteUserMock).toHaveBeenCalledWith(uid);
      expect(deleteAllApeKeysMock).toHaveBeenCalledWith(uid);
      expect(deleteAllPresetsMock).toHaveBeenCalledWith(uid);
      expect(deleteConfigMock).toHaveBeenCalledWith(uid);
      expect(deleteAllResultMock).toHaveBeenCalledWith(uid);
      expect(purgeUserFromDailyLeaderboardsMock).toHaveBeenCalledWith(
        uid,
        (await configuration).dailyLeaderboards
      );
    });
  });
  describe("link discord", () => {
    const getUserMock = vi.spyOn(UserDal, "getPartialUser");
    const isDiscordIdAvailableMock = vi.spyOn(UserDal, "isDiscordIdAvailable");
    const isStateValidForUserMock = vi.spyOn(
      DiscordUtils,
      "iStateValidForUser"
    );
    const getDiscordUserMock = vi.spyOn(DiscordUtils, "getDiscordUser");
    const blocklistContainsMock = vi.spyOn(BlocklistDal, "contains");

    beforeEach(async () => {
      isStateValidForUserMock.mockResolvedValue(true);
      getDiscordUserMock.mockResolvedValue({
        id: "discordUserId",
        avatar: "discorUserAvatar",
        username: "discordUserName",
        discriminator: "discordUserDiscriminator",
      });
      isDiscordIdAvailableMock.mockResolvedValue(true);
      blocklistContainsMock.mockResolvedValue(false);
      await enableDiscordIntegration(true);
    });
    afterEach(() => {
      [
        getUserMock,
        isStateValidForUserMock,
        isDiscordIdAvailableMock,
        getDiscordUserMock,
      ].forEach((it) => it.mockReset());
    });

    it("should not link if discordId is blocked", async () => {
      //GIVEN
      const uid = mockDecodedToken.uid;
      const user = {
        uid,
        name: "name",
        email: "email",
      } as Partial<MonkeyTypes.DBUser> as MonkeyTypes.DBUser;
      getUserMock.mockResolvedValue(user);
      blocklistContainsMock.mockResolvedValue(true);

      //WHEN
      const result = await mockApp
        .post("/users/discord/link")
        .set("Authorization", "Bearer 123456789")
        .set({
          Accept: "application/json",
        })
        .send({
          tokenType: "tokenType",
          accessToken: "accessToken",
          state: "statestatestatestate",
        })
        .expect(409);

      //THEN
      expect(result.body.message).toEqual("The Discord account is blocked");

      expect(blocklistContainsMock).toBeCalledWith({
        discordId: "discordUserId",
      });
    });
  });
  describe("getCurrentTestActivity", () => {
    const getUserMock = vi.spyOn(UserDal, "getPartialUser");

    afterEach(() => {
      getUserMock.mockReset();
    });
    it("gets", async () => {
      //GIVEN
      vi.useFakeTimers().setSystemTime(1712102400000);
      const user = {
        uid: mockDecodedToken.uid,
        testActivity: {
          "2024": fillYearWithDay(94),
        },
      } as Partial<MonkeyTypes.DBUser> as MonkeyTypes.DBUser;
      getUserMock.mockResolvedValue(user);

      //WHEN
      const result = await mockApp
        .get("/users/currentTestActivity")
        .set("Authorization", "Bearer 123456789")
        .send()
        .expect(200);

      //THEN
      expect(result.body.data.lastDay).toEqual(1712102400000);
      const testsByDays = result.body.data.testsByDays;
      expect(testsByDays).toHaveLength(372);
      expect(testsByDays[6]).toEqual(null); //2023-04-04
      expect(testsByDays[277]).toEqual(null); //2023-12-31
      expect(testsByDays[278]).toEqual(1); //2024-01-01
      expect(testsByDays[371]).toEqual(94); //2024-01
    });
  });
  describe("getStreak", () => {
    const getUserMock = vi.spyOn(UserDal, "getPartialUser");

    afterEach(() => {
      getUserMock.mockReset();
    });
    it("gets", async () => {
      //GIVEN
      const user = {
        uid: mockDecodedToken.uid,
        streak: {
          lastResultTimestamp: 1712102400000,
          length: 42,
          maxLength: 1024,
          hourOffset: 2,
        },
      } as Partial<MonkeyTypes.DBUser> as MonkeyTypes.DBUser;
      getUserMock.mockResolvedValue(user);

      //WHEN
      const result = await mockApp
        .get("/users/streak")
        .set("Authorization", "Bearer 123456789")
        .send()
        .expect(200);

      //THEN
      const streak: SharedTypes.UserStreak = result.body.data;
      expect(streak).toEqual({
        lastResultTimestamp: 1712102400000,
        length: 42,
        maxLength: 1024,
        hourOffset: 2,
      });
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

async function enablePremiumFeatures(premium: boolean): Promise<void> {
  const mockConfig = _.merge(await configuration, {
    users: { premium: { enabled: premium } },
  });

  vi.spyOn(Configuration, "getCachedConfiguration").mockResolvedValue(
    mockConfig
  );
}

async function enableAdminFeatures(enabled: boolean): Promise<void> {
  const mockConfig = _.merge(await configuration, {
    admin: { endpointsEnabled: enabled },
  });

  vi.spyOn(Configuration, "getCachedConfiguration").mockResolvedValue(
    mockConfig
  );
}

async function enableSignup(enabled: boolean): Promise<void> {
  const mockConfig = _.merge(await configuration, {
    users: { signUp: enabled },
  });

  vi.spyOn(Configuration, "getCachedConfiguration").mockResolvedValue(
    mockConfig
  );
}

async function enableDiscordIntegration(enabled: boolean): Promise<void> {
  const mockConfig = _.merge(await configuration, {
    users: { discordIntegration: { enabled } },
  });

  vi.spyOn(Configuration, "getCachedConfiguration").mockResolvedValue(
    mockConfig
  );
}
