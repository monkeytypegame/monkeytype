import request from "supertest";
import app from "../../../src/app";
import * as Configuration from "../../../src/init/configuration";
import { generateCurrentTestActivity } from "../../../src/api/controllers/user";
import * as UserDal from "../../../src/dal/user";
import { DecodedIdToken } from "firebase-admin/auth";
import * as AuthUtils from "../../../src/utils/auth";
import * as BlocklistDal from "../../../src/dal/blocklist";
import * as ApeKeys from "../../../src/dal/ape-keys";
import * as PresetDal from "../../../src/dal/preset";
import * as ConfigDal from "../../../src/dal/config";
import * as ResultDal from "../../../src/dal/result";
import * as ReportDal from "../../../src/dal/report";
import * as DailyLeaderboards from "../../../src/utils/daily-leaderboards";
import * as LeaderboardDal from "../../../src/dal/leaderboards";
import GeorgeQueue from "../../../src/queues/george-queue";
import * as DiscordUtils from "../../../src/utils/discord";
import * as Captcha from "../../../src/utils/captcha";
import * as FirebaseAdmin from "../../../src/init/firebase-admin";
import { FirebaseError } from "firebase-admin";
import * as ApeKeysDal from "../../../src/dal/ape-keys";
import * as LogDal from "../../../src/dal/logs";
import { ObjectId } from "mongodb";
import { PersonalBest } from "@monkeytype/contracts/schemas/shared";
import { pb } from "../../dal/leaderboards.spec";
import { mockAuthenticateWithApeKey } from "../../__testData__/auth";
import { LeaderboardRank } from "@monkeytype/contracts/schemas/leaderboards";
import { randomUUID } from "node:crypto";
import _ from "lodash";
import { MonkeyMail, UserStreak } from "@monkeytype/contracts/schemas/users";
import { isFirebaseError } from "../../../src/utils/error";

const mockApp = request(app);
const configuration = Configuration.getCachedConfiguration();
const uid = "123456789";

const mockDecodedToken: DecodedIdToken = {
  uid,
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
      await mockApp.get("/users/checkName/NewUser").expect(200);

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
        .expect(200);

      const response = await mockApp
        .get("/users")
        .set("authorization", "Uid 123456789")
        .send()
        .expect(200);

      const {
        body: { data: userData },
      } = response;

      expect(userData.name).toBe(newUser.name);
      expect(userData.email).toBe(newUser.email);
      expect(userData.uid).toBe(newUser.uid);

      await mockApp.get("/users/checkName/NewUser").expect(409);
    });
  });
  describe("user signup", () => {
    const blocklistContainsMock = vi.spyOn(BlocklistDal, "contains");
    const firebaseDeleteUserMock = vi.spyOn(AuthUtils, "deleteUser");
    const usernameAvailableMock = vi.spyOn(UserDal, "isNameAvailable");
    const verifyCaptchaMock = vi.spyOn(Captcha, "verify");
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

    it("should fail if blocklisted", async () => {
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
        .expect(409);

      //THEN
      expect(result.body.message).toEqual("Username or email blocked");
      expect(blocklistContainsMock).toHaveBeenCalledWith({
        name: "NewUser",
        email: "newuser@mail.com",
      });

      //user will be created in firebase from the frontend, make sure we remove it
      expect(firebaseDeleteUserMock).toHaveBeenCalledWith("123456789");
      expect(verifyCaptchaMock).toHaveBeenCalledWith("captcha");
    });

    it("should fail if domain is blacklisted", async () => {
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

    it("should fail if username is taken", async () => {
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
    it("should fail if capture is invalid", async () => {
      //GIVEN
      verifyCaptchaMock.mockResolvedValue(false);

      const newUser = {
        name: "NewUser",
        uid: "123456789",
        email: "newuser@mail.com",
        captcha: "captcha",
      };

      //WHEN
      const { body } = await mockApp
        .post("/users/signup")
        .set("authorization", "Uid 123456789|newuser@mail.com")
        .send(newUser)
        .expect(422);

      //THEN
      expect(body.message).toEqual("Captcha challenge failed");
    });
    it("should fail if username too long", async () => {
      //GIVEN
      const newUser = {
        uid: "123456789",
        email: "newuser@mail.com",
        captcha: "captcha",
      };

      //WHEN
      const { body } = await mockApp
        .post("/users/signup")
        .set("authorization", "Uid 123456789|newuser@mail.com")
        .send({ ...newUser, name: new Array(17).fill("x").join("") })
        .expect(422);

      //THEN
      expect(body).toEqual({
        message: "Invalid request data schema",
        validationErrors: [
          '"name" String must contain at most 16 character(s)',
        ],
      });
    });
    it("should fail if username contains profanity", async () => {
      //GIVEN
      const newUser = {
        uid: "123456789",
        email: "newuser@mail.com",
        captcha: "captcha",
      };

      //WHEN
      const { body } = await mockApp
        .post("/users/signup")
        .set("authorization", "Uid 123456789|newuser@mail.com")
        .send({ ...newUser, name: "miodec" })
        .expect(422);

      //THEN
      expect(body).toEqual({
        message: "Invalid request data schema",
        validationErrors: [
          '"name" Profanity detected. Please remove it. If you believe this is a mistake, please contact us. (miodec)',
        ],
      });
    });
  });
  describe("sendVerificationEmail", () => {
    const adminGetUserMock = vi.fn();
    const adminGenerateVerificationLinkMock = vi.fn();
    const getPartialUserMock = vi.spyOn(UserDal, "getPartialUser");

    vi.spyOn(FirebaseAdmin, "default").mockReturnValue({
      auth: () => ({
        getUser: adminGetUserMock,
        generateEmailVerificationLink: adminGenerateVerificationLinkMock,
      }),
    } as any);

    vi.mock("../../../src/queues/email-queue", () => ({
      __esModule: true,
      default: { sendVerificationEmail: vi.fn() },
    }));

    beforeEach(() => {
      adminGetUserMock.mockReset().mockResolvedValue({ emailVerified: false });
      getPartialUserMock.mockReset().mockResolvedValue({
        uid,
        name: "Bob",
        email: "newuser@mail.com",
      } as any);
    });

    it("should send verfification email", async () => {
      //GIVEN

      //"HEN
      const { body } = await mockApp
        .get("/users/verificationEmail")
        .set("authorization", `Uid ${uid}|newuser@mail.com`)
        .expect(200);

      //THEN
      expect(body).toEqual({
        message: "Email sent",
        data: null,
      });

      expect(adminGetUserMock).toHaveBeenCalledWith(uid);
      expect(getPartialUserMock).toHaveBeenCalledWith(
        uid,
        "request verification email",
        ["uid", "name", "email"]
      );
      expect(adminGenerateVerificationLinkMock).toHaveBeenCalledWith(
        "newuser@mail.com",
        { url: "http://localhost:3000" }
      );
    });
    it("should fail with missing firebase user", async () => {
      //GIVEN
      adminGetUserMock.mockRejectedValue(new Error("test"));

      //WHEN
      const { body } = await mockApp
        .get("/users/verificationEmail")
        .set("authorization", `Uid ${uid}|newuser@mail.com`)
        .expect(500);

      //THEN
      expect(body.message).toContain(
        "Auth user not found, even though the token got decoded"
      );
    });
    it("should fail with already verified email", async () => {
      //GIVEN
      adminGetUserMock.mockResolvedValue({ emailVerified: true });

      //WHEN
      const { body } = await mockApp
        .get("/users/verificationEmail")
        .set("authorization", `Uid ${uid}|newuser@mail.com`)
        .expect(400);

      //THEN
      expect(body.message).toEqual("Email already verified");
    });
    it("should fail with email not matching the one from the authentication", async () => {
      //GIVEN
      getPartialUserMock.mockResolvedValue({
        email: "nonmatching@example.com",
      } as any);

      //WHEN
      const { body } = await mockApp
        .get("/users/verificationEmail")
        .set("authorization", `Uid ${uid}|newuser@mail.com`)
        .expect(400);

      //THEN
      expect(body.message).toEqual(
        "Authenticated email does not match the email found in the database. This might happen if you recently changed your email. Please refresh and try again."
      );
    });

    it("should fail with too many firebase requests", async () => {
      //GIVEN
      const mockFirebaseError = {
        code: "auth/too-many-requests",
        codePrefix: "auth",
        errorInfo: {
          code: "auth/too-many-requests",
          message: "Too many requests",
        },
      };
      adminGenerateVerificationLinkMock.mockRejectedValue(mockFirebaseError);
      expect(isFirebaseError(mockFirebaseError)).toBe(true);

      //WHEN
      const { body } = await mockApp
        .get("/users/verificationEmail")
        .set("authorization", `Uid ${uid}|newuser@mail.com`)
        .expect(429);

      //THEN
      expect(body.message).toEqual("Too many requests. Please try again later");
    });
    it("should fail with firebase user not found", async () => {
      //GIVEN
      const mockFirebaseError = {
        code: "auth/user-not-found",
        codePrefix: "auth",
        errorInfo: {
          code: "auth/user-not-found",
          message: "User not found",
        },
      };
      adminGenerateVerificationLinkMock.mockRejectedValue(mockFirebaseError);
      expect(isFirebaseError(mockFirebaseError)).toBe(true);

      //WHEN
      const { body } = await mockApp
        .get("/users/verificationEmail")
        .set("authorization", `Uid ${uid}|newuser@mail.com`)
        .expect(500);

      //THEN
      expect(body.message).toEqual(
        "Auth user not found when the user was found in the database. Contact support with this error message and your email\n" +
          'Stack: {"decodedTokenEmail":"newuser@mail.com","userInfoEmail":"newuser@mail.com"}'
      );
    });
    it("should fail with unknown error", async () => {
      //GIVEN
      const mockFirebaseError = {
        message: "Internal server error",
      };
      adminGenerateVerificationLinkMock.mockRejectedValue(mockFirebaseError);
      expect(isFirebaseError(mockFirebaseError)).toBe(false);

      //WHEN
      const { body } = await mockApp
        .get("/users/verificationEmail")
        .set("authorization", `Uid ${uid}|newuser@mail.com`)
        .expect(500);

      //THEN
      expect(body.message).toEqual(
        "Firebase failed to generate an email verification link: Internal server error"
      );
    });
  });
  describe("sendForgotPasswordEmail", () => {
    const sendForgotPasswordEmailMock = vi.spyOn(
      AuthUtils,
      "sendForgotPasswordEmail"
    );
    beforeEach(() => {
      sendForgotPasswordEmailMock.mockReset().mockResolvedValue();
    });

    it("should send forgot password email without authentication", async () => {
      //GIVEN

      //WHEN
      const { body } = await mockApp
        .post("/users/forgotPasswordEmail")
        .send({ email: "bob@example.com" });

      //THEN
      expect(body).toEqual({
        message:
          "Password reset request received. If the email is valid, you will receive an email shortly.",
        data: null,
      });

      expect(sendForgotPasswordEmailMock).toHaveBeenCalledWith(
        "bob@example.com"
      );
    });
    it("should fail without mandatory properties", async () => {
      //WHEN
      const { body } = await mockApp
        .post("/users/forgotPasswordEmail")
        .expect(422);

      //THEN
      expect(body).toEqual({
        message: "Invalid request data schema",
        validationErrors: ['"email" Required'],
      });
    });
    it("should fail without unknown properties", async () => {
      //WHEN
      const { body } = await mockApp
        .post("/users/forgotPasswordEmail")
        .send({ email: "bob@example.com", extra: "value" })
        .expect(422);

      //THEN
      expect(body).toEqual({
        message: "Invalid request data schema",
        validationErrors: ["Unrecognized key(s) in object: 'extra'"],
      });
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
      } as Partial<UserDal.DBUser> as UserDal.DBUser);

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
      } as Partial<UserDal.DBUser> as UserDal.DBUser);
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
      } as Partial<UserDal.DBUser> as UserDal.DBUser;
      await getUserMock.mockResolvedValue(user);

      //WHEN
      await mockApp
        .delete("/users/")
        .set("Authorization", "Bearer 123456789")
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
      } as Partial<UserDal.DBUser> as UserDal.DBUser;
      getUserMock.mockResolvedValue(user);

      //WHEN
      await mockApp
        .delete("/users/")
        .set("Authorization", "Bearer 123456789")
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
  describe("resetUser", () => {
    const getPartialUserMock = vi.spyOn(UserDal, "getPartialUser");
    const resetUserMock = vi.spyOn(UserDal, "resetUser");
    const deleteAllApeKeysMock = vi.spyOn(ApeKeysDal, "deleteAllApeKeys");
    const deleteAllPresetsMock = vi.spyOn(PresetDal, "deleteAllPresets");
    const deleteAllResultsMock = vi.spyOn(ResultDal, "deleteAll");
    const deleteConfigMock = vi.spyOn(ConfigDal, "deleteConfig");
    const purgeUserFromDailyLeaderboardsMock = vi.spyOn(
      DailyLeaderboards,
      "purgeUserFromDailyLeaderboards"
    );

    const unlinkDiscordMock = vi.spyOn(GeorgeQueue, "unlinkDiscord");
    const addImportantLogMock = vi.spyOn(LogDal, "addImportantLog");

    beforeEach(() => {
      getPartialUserMock.mockReset().mockResolvedValue({
        banned: false,
        name: "bob",
        email: "bob@example.com",
      } as any);

      [
        resetUserMock,
        deleteAllApeKeysMock,
        deleteAllPresetsMock,
        deleteAllResultsMock,
        deleteConfigMock,
        purgeUserFromDailyLeaderboardsMock,
        unlinkDiscordMock,
        addImportantLogMock,
      ].forEach((it) => it.mockReset());
    });

    it("should reset user", async () => {
      //GIVEN

      //WHEN
      const { body } = await mockApp
        .patch("/users/reset")
        .set("authorization", `Uid ${uid}`)
        .expect(200);

      //THEN
      expect(body).toEqual({
        message: "User reset",
        data: null,
      });

      [
        resetUserMock,
        deleteAllApeKeysMock,
        deleteAllPresetsMock,
        deleteAllResultsMock,
        deleteConfigMock,
      ].forEach((it) => expect(it).toHaveBeenCalledWith(uid));
      expect(purgeUserFromDailyLeaderboardsMock).toHaveBeenCalledWith(
        uid,
        (await Configuration.getLiveConfiguration()).dailyLeaderboards
      );
      expect(unlinkDiscordMock).not.toHaveBeenCalled();
      expect(addImportantLogMock).toHaveBeenCalledWith(
        "user_reset",
        "bob@example.com bob",
        uid
      );
    });
    it("should unlink discord", async () => {
      //GIVEN
      getPartialUserMock.mockResolvedValue({ discordId: "discordId" } as any);

      //WHEN
      await mockApp
        .patch("/users/reset")
        .set("authorization", `Uid ${uid}`)
        .expect(200);

      //THEN
      expect(unlinkDiscordMock).toHaveBeenCalledWith("discordId", uid);
    });
    it("should fail resetting a banned user", async () => {
      //GIVEN
      getPartialUserMock.mockResolvedValue({ banned: true } as any);

      //WHEN
      const { body } = await mockApp
        .patch("/users/reset")
        .set("authorization", `Uid ${uid}`)
        .expect(403);

      //THEN
      expect(body.message).toEqual("Banned users cannot reset their account");
    });
  });
  describe("update name", () => {
    const getPartialUserMock = vi.spyOn(UserDal, "getPartialUser");
    const updateNameMock = vi.spyOn(UserDal, "updateName");
    const addImportantLogMock = vi.spyOn(LogDal, "addImportantLog");

    beforeEach(() => {
      getPartialUserMock.mockReset();
      updateNameMock.mockReset();
      addImportantLogMock.mockReset();
    });

    it("should update the username", async () => {
      //GIVEN
      getPartialUserMock.mockResolvedValue({
        name: "Bob",
        lastNameChange: 1000,
      } as any);
      //WHEN
      const { body } = await mockApp
        .patch("/users/name")
        .set("authorization", `Uid ${uid}`)
        .send({ name: "newName" })
        .expect(200);

      //THEN
      expect(body).toEqual({
        message: "User's name updated",
        data: null,
      });

      expect(updateNameMock).toHaveBeenCalledWith(uid, "newName", "Bob");
      expect(addImportantLogMock).toHaveBeenCalledWith(
        "user_name_updated",
        "changed name from Bob to newName",
        uid
      );
    });
    it("should fail for banned users", async () => {
      //GIVEN
      getPartialUserMock.mockResolvedValue({ banned: true } as any);

      //WHEN
      const { body } = await mockApp
        .patch("/users/name")
        .set("authorization", `Uid ${uid}`)
        .send({ name: "newName" })
        .expect(403);

      //THEN
      expect(body.message).toEqual("Banned users cannot change their name");
      expect(updateNameMock).not.toHaveBeenCalled();
    });
    it("should fail changing name within last 30 days", async () => {
      //GIVEN
      getPartialUserMock.mockResolvedValue({
        lastNameChange: Date.now().valueOf() - 60_000,
      } as any);

      //WHEN
      const { body } = await mockApp
        .patch("/users/name")
        .set("authorization", `Uid ${uid}`)
        .send({ name: "newName" })
        .expect(409);

      //THEN
      expect(body.message).toEqual(
        "You can change your name once every 30 days"
      );
      expect(updateNameMock).not.toHaveBeenCalled();
    });
    it("should update the username within 30 days if user needs to change", async () => {
      //GIVEN
      getPartialUserMock.mockResolvedValue({
        name: "Bob",
        lastNameChange: Date.now().valueOf() - 60_000,
        needsToChangeName: true,
      } as any);
      //WHEN
      const { body } = await mockApp
        .patch("/users/name")
        .set("authorization", `Uid ${uid}`)
        .send({ name: "newName" })
        .expect(200);

      //THEN
      expect(body).toEqual({
        message: "User's name updated",
        data: null,
      });

      expect(updateNameMock).toHaveBeenCalledWith(uid, "newName", "Bob");
    });
    it("should fail without mandatory properties", async () => {
      //WHEN
      const { body } = await mockApp
        .patch("/users/name")
        .set("authorization", `Uid ${uid}`)
        .expect(422);

      //THEN
      expect(body).toEqual({
        message: "Invalid request data schema",
        validationErrors: ['"name" Required'],
      });
    });
    it("should fail without unknown properties", async () => {
      //WHEN
      const { body } = await mockApp
        .patch("/users/name")
        .set("authorization", `Uid ${uid}`)
        .send({ name: "newName", extra: "value" })
        .expect(422);

      //THEN
      expect(body).toEqual({
        message: "Invalid request data schema",
        validationErrors: ["Unrecognized key(s) in object: 'extra'"],
      });
    });
    it("should fail if username contains profanity", async () => {
      //WHEN
      const { body } = await mockApp
        .patch("/users/name")
        .set("authorization", `Uid ${uid}`)
        .send({ name: "miodec" })
        .expect(422);

      //THEN
      expect(body).toEqual({
        message: "Invalid request data schema",
        validationErrors: [
          '"name" Profanity detected. Please remove it. If you believe this is a mistake, please contact us. (miodec)',
        ],
      });
    });
  });
  describe("clear PBs", () => {
    const clearPbMock = vi.spyOn(UserDal, "clearPb");
    const purgeUserFromDailyLeaderboardsMock = vi.spyOn(
      DailyLeaderboards,
      "purgeUserFromDailyLeaderboards"
    );
    const addImportantLogMock = vi.spyOn(LogDal, "addImportantLog");

    beforeEach(() => {
      clearPbMock.mockReset();
      purgeUserFromDailyLeaderboardsMock.mockReset();
      addImportantLogMock.mockReset();
    });

    it("should clear pb", async () => {
      //GIVEN

      //WHEN
      const { body } = await mockApp
        .delete("/users/personalBests")
        .set("authorization", `Uid ${uid}`)
        .expect(200);

      //THEN
      expect(body).toEqual({
        message: "User's PB cleared",
        data: null,
      });
      expect(clearPbMock).toHaveBeenCalledWith(uid);
      expect(purgeUserFromDailyLeaderboardsMock).toHaveBeenCalledWith(
        uid,
        (await Configuration.getLiveConfiguration()).dailyLeaderboards
      );
      expect(addImportantLogMock).toHaveBeenCalledWith(
        "user_cleared_pbs",
        "",
        uid
      );
    });
  });
  describe("opt out of leaderboard", () => {
    const optOutOfLeaderboardsMock = vi.spyOn(UserDal, "optOutOfLeaderboards");
    const purgeUserFromDailyLeaderboardsMock = vi.spyOn(
      DailyLeaderboards,
      "purgeUserFromDailyLeaderboards"
    );
    const addImportantLogMock = vi.spyOn(LogDal, "addImportantLog");

    beforeEach(() => {
      optOutOfLeaderboardsMock.mockReset();
      purgeUserFromDailyLeaderboardsMock.mockReset();
      addImportantLogMock.mockReset();
    });
    it("should opt out", async () => {
      //GIVEN

      //WHEN
      const { body } = await mockApp
        .post("/users/optOutOfLeaderboards")
        .set("authorization", `Uid ${uid}`)
        .expect(200);

      //THEN
      expect(body).toEqual({
        message: "User opted out of leaderboards",
        data: null,
      });

      expect(optOutOfLeaderboardsMock).toHaveBeenCalledWith(uid);
      expect(purgeUserFromDailyLeaderboardsMock).toHaveBeenCalledWith(
        uid,
        (await Configuration.getLiveConfiguration()).dailyLeaderboards
      );
      expect(addImportantLogMock).toHaveBeenCalledWith(
        "user_opted_out_of_leaderboards",
        "",
        uid
      );
    });
    it("should fail with unknown properties", async () => {
      //WHEN
      const { body } = await mockApp
        .post("/users/optOutOfLeaderboards")
        .set("authorization", `Uid ${uid}`)
        .send({ extra: "value" });
      //TODO.expect(422);

      //THEN
      /* TODO:
        expect(body).toEqual({});
        */
    });
  });
  describe("update email", () => {
    const authUpdateEmailMock = vi.spyOn(AuthUtils, "updateUserEmail");
    const userUpdateEmailMock = vi.spyOn(UserDal, "updateEmail");
    const addImportantLogMock = vi.spyOn(LogDal, "addImportantLog");

    beforeEach(() => {
      authUpdateEmailMock.mockReset();
      userUpdateEmailMock.mockReset();
      addImportantLogMock.mockReset();
    });
    it("should update users email", async () => {
      //GIVEN
      const newEmail = "newEmail@example.com";

      //WHEN
      const { body } = await mockApp
        .patch("/users/email")
        .set("authorization", `Uid ${uid}`)
        .send({ newEmail, previousEmail: "previousEmail@example.com" })
        .expect(200);

      //THEN
      expect(body).toEqual({
        message: "Email updated",
        data: null,
      });

      expect(authUpdateEmailMock).toHaveBeenCalledWith(
        uid,
        newEmail.toLowerCase()
      );
      expect(userUpdateEmailMock).toHaveBeenCalledWith(
        uid,
        newEmail.toLowerCase()
      );
      expect(addImportantLogMock).toHaveBeenCalledWith(
        "user_email_updated",
        "changed email to newemail@example.com",
        uid
      );
    });
    it("should fail for duplicate email", async () => {
      //GIVEN
      const mockFirebaseError = {
        code: "auth/email-already-exists",
        codePrefix: "auth",
        errorInfo: {
          code: "auth/email-already-exists",
          message: "Email already exists",
        },
      };
      authUpdateEmailMock.mockRejectedValue(mockFirebaseError);
      expect(isFirebaseError(mockFirebaseError)).toBe(true);

      //WHEN
      const { body } = await mockApp
        .patch("/users/email")
        .set("authorization", `Uid ${uid}`)
        .send({
          newEmail: "newEmail@example.com",
          previousEmail: "previousEmail@example.com",
        })
        .expect(409);

      expect(body.message).toEqual(
        "The email address is already in use by another account"
      );

      expect(userUpdateEmailMock).not.toHaveBeenCalled();
    });

    it("should fail for invalid email", async () => {
      //GIVEN
      const mockFirebaseError = {
        code: "auth/invalid-email",
        codePrefix: "auth",
        errorInfo: {
          code: "auth/invalid-email",
          message: "Invalid email",
        },
      };
      authUpdateEmailMock.mockRejectedValue(mockFirebaseError);
      expect(isFirebaseError(mockFirebaseError)).toBe(true);

      //WHEN
      const { body } = await mockApp
        .patch("/users/email")
        .set("authorization", `Uid ${uid}`)
        .send({
          newEmail: "newEmail@example.com",
          previousEmail: "previousEmail@example.com",
        })
        .expect(400);

      expect(body.message).toEqual("Invalid email address");

      expect(userUpdateEmailMock).not.toHaveBeenCalled();
    });
    it("should fail for too many requests", async () => {
      //GIVEN
      const mockFirebaseError = {
        code: "auth/too-many-requests",
        codePrefix: "auth",
        errorInfo: {
          code: "auth/too-many-requests",
          message: "Too many requests",
        },
      };
      authUpdateEmailMock.mockRejectedValue(mockFirebaseError);
      expect(isFirebaseError(mockFirebaseError)).toBe(true);

      //WHEN
      const { body } = await mockApp
        .patch("/users/email")
        .set("authorization", `Uid ${uid}`)
        .send({
          newEmail: "newEmail@example.com",
          previousEmail: "previousEmail@example.com",
        })
        .expect(429);

      expect(body.message).toEqual("Too many requests. Please try again later");

      expect(userUpdateEmailMock).not.toHaveBeenCalled();
    });
    it("should fail for unknown user", async () => {
      //GIVEN
      const mockFirebaseError = {
        code: "auth/user-not-found",
        codePrefix: "auth",
        errorInfo: {
          code: "auth/user-not-found",
          message: "User not found",
        },
      };
      authUpdateEmailMock.mockRejectedValue(mockFirebaseError);
      expect(isFirebaseError(mockFirebaseError)).toBe(true);

      //WHEN
      const { body } = await mockApp
        .patch("/users/email")
        .set("authorization", `Uid ${uid}`)
        .send({
          newEmail: "newEmail@example.com",
          previousEmail: "previousEmail@example.com",
        })
        .expect(404);

      expect(body.message).toEqual(
        "User not found in the auth system\nStack: update email"
      );

      expect(userUpdateEmailMock).not.toHaveBeenCalled();
    });
    it("should fail for invalid user token", async () => {
      //GIVEN
      authUpdateEmailMock.mockRejectedValue({
        code: "auth/invalid-user-token",
        codePrefix: "auth",
        errorInfo: {
          code: "auth/invalid-user-token",
          message: "Invalid user token",
        },
      });

      //WHEN
      const { body } = await mockApp
        .patch("/users/email")
        .set("authorization", `Uid ${uid}`)
        .send({
          newEmail: "newEmail@example.com",
          previousEmail: "previousEmail@example.com",
        })
        .expect(401);

      expect(body.message).toEqual("Invalid user token\nStack: update email");

      expect(userUpdateEmailMock).not.toHaveBeenCalled();
    });
    it("should fail for unknown error", async () => {
      //GIVEN
      authUpdateEmailMock.mockRejectedValue({} as FirebaseError);

      //WHEN
      await mockApp
        .patch("/users/email")
        .set("authorization", `Uid ${uid}`)
        .send({
          newEmail: "newEmail@example.com",
          previousEmail: "previousEmail@example.com",
        })
        .expect(500);
    });
    it("should fail without mandatory properties", async () => {
      //WHEN
      const { body } = await mockApp
        .patch("/users/email")
        .set("authorization", `Uid ${uid}`)
        .expect(422);

      expect(body).toEqual({
        message: "Invalid request data schema",
        validationErrors: ['"newEmail" Required', '"previousEmail" Required'],
      });
    });
    it("should fail with unknown properties", async () => {
      //WHEN
      const { body } = await mockApp
        .patch("/users/email")
        .set("authorization", `Uid ${uid}`)
        .send({
          newEmail: "newEmail@example.com",
          previousEmail: "previousEmail@example.com",
          extra: "value",
        })
        .expect(422);

      expect(body).toEqual({
        message: "Invalid request data schema",
        validationErrors: ["Unrecognized key(s) in object: 'extra'"],
      });
    });
  });
  describe("update password", () => {
    const updatePasswordMock = vi.spyOn(AuthUtils, "updateUserPassword");

    beforeEach(() => {
      updatePasswordMock.mockReset();
    });

    it("should update password", async () => {
      //WHEN
      const { body } = await mockApp
        .patch("/users/password")
        .set("authorization", `Uid ${uid}`)
        .send({ newPassword: "sw0rdf1sh" })
        .expect(200);

      //THEN
      expect(body).toEqual({
        message: "Password updated",
        data: null,
      });
      expect(updatePasswordMock).toHaveBeenCalledWith(uid, "sw0rdf1sh");
    });
    it("should fail without mandatory properties", async () => {
      //WHEN
      const { body } = await mockApp
        .patch("/users/password")
        .set("authorization", `Uid ${uid}`)
        .expect(422);

      //THEN
      expect(body).toEqual({
        message: "Invalid request data schema",
        validationErrors: ['"newPassword" Required'],
      });
    });
    it("should fail with unknown properties", async () => {
      //WHEN
      const { body } = await mockApp
        .patch("/users/password")
        .set("authorization", `Uid ${uid}`)
        .send({ newPassword: "sw0rdf1sh", extra: "value" })
        .expect(422);

      //THEN
      expect(body).toEqual({
        message: "Invalid request data schema",
        validationErrors: ["Unrecognized key(s) in object: 'extra'"],
      });
    });
    it("should fail with password too short", async () => {
      //WHEN
      const { body } = await mockApp
        .patch("/users/password")
        .set("authorization", `Uid ${uid}`)
        .send({ newPassword: "test" })
        .expect(422);

      //THEN
      expect(body).toEqual({
        message: "Invalid request data schema",
        validationErrors: [
          '"newPassword" String must contain at least 6 character(s)',
        ],
      });
    });
  });
  describe("get oauth link", () => {
    const getOauthLinkMock = vi.spyOn(DiscordUtils, "getOauthLink");
    const url = "http://example.com:1234?test";
    beforeEach(() => {
      enableDiscordIntegration(true);
      getOauthLinkMock.mockReset().mockResolvedValue(url);
    });

    it("should get oauth link", async () => {
      //WHEN
      const { body } = await mockApp
        .get("/users/discord/oauth")
        .set("authorization", `Uid ${uid}`)
        .expect(200);

      //THEN
      expect(body).toEqual({
        message: "Discord oauth link generated",
        data: { url },
      });
      expect(getOauthLinkMock).toHaveBeenCalledWith(uid);
    });
    it("should fail if feature is not enabled", async () => {
      //GIVEN
      enableDiscordIntegration(false);

      //WHEN
      const { body } = await mockApp
        .get("/users/discord/oauth")
        .set("authorization", `Uid ${uid}`)
        .expect(503);

      //THEN
      expect(body.message).toEqual(
        "Discord integration is not available at this time"
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
    const userLinkDiscordMock = vi.spyOn(UserDal, "linkDiscord");
    const georgeLinkDiscordMock = vi.spyOn(GeorgeQueue, "linkDiscord");
    const addImportantLogMock = vi.spyOn(LogDal, "addImportantLog");

    beforeEach(async () => {
      isStateValidForUserMock.mockResolvedValue(true);
      getUserMock.mockResolvedValue({} as any);
      getDiscordUserMock.mockResolvedValue({
        id: "discordUserId",
        avatar: "discordUserAvatar",
        username: "discordUserName",
        discriminator: "discordUserDiscriminator",
      });
      isDiscordIdAvailableMock.mockResolvedValue(true);
      blocklistContainsMock.mockResolvedValue(false);
      userLinkDiscordMock.mockResolvedValue();
      await enableDiscordIntegration(true);
    });
    afterEach(() => {
      [
        getUserMock,
        isStateValidForUserMock,
        isDiscordIdAvailableMock,
        getDiscordUserMock,
        blocklistContainsMock,
        userLinkDiscordMock,
        georgeLinkDiscordMock,
        addImportantLogMock,
      ].forEach((it) => it.mockReset());
    });

    it("should link discord", async () => {
      //GIVEN
      getUserMock.mockResolvedValue({} as any);

      //WHEN
      const { body } = await mockApp
        .post("/users/discord/link")
        .set("Authorization", `Uid ${uid}`)
        .send({
          tokenType: "tokenType",
          accessToken: "accessToken",
          state: "statestatestatestate",
        })
        .expect(200);

      //THEN
      expect(body).toEqual({
        message: "Discord account linked",
        data: {
          discordId: "discordUserId",
          discordAvatar: "discordUserAvatar",
        },
      });
      expect(isStateValidForUserMock).toHaveBeenCalledWith(
        "statestatestatestate",
        uid
      );
      expect(getUserMock).toHaveBeenCalledWith(
        uid,
        "link discord",
        expect.any(Array)
      );
      expect(getDiscordUserMock).toHaveBeenCalledWith(
        "tokenType",
        "accessToken"
      );
      expect(isDiscordIdAvailableMock).toHaveBeenCalledWith("discordUserId");
      expect(blocklistContainsMock).toHaveBeenCalledWith({
        discordId: "discordUserId",
      });
      expect(userLinkDiscordMock).toHaveBeenCalledWith(
        uid,
        "discordUserId",
        "discordUserAvatar"
      );
      expect(georgeLinkDiscordMock).toHaveBeenCalledWith("discordUserId", uid);
      expect(addImportantLogMock).toHaveBeenCalledWith(
        "user_discord_link",
        "linked to discordUserId",
        uid
      );
    });

    it("should update existing discord avatar", async () => {
      //GIVEN
      getUserMock.mockResolvedValue({ discordId: "existingDiscordId" } as any);

      //WHEN
      const { body } = await mockApp
        .post("/users/discord/link")
        .set("Authorization", `Uid ${uid}`)
        .send({
          tokenType: "tokenType",
          accessToken: "accessToken",
          state: "statestatestatestate",
        })
        .expect(200);

      //THEN
      expect(body).toEqual({
        message: "Discord avatar updated",
        data: {
          discordId: "discordUserId",
          discordAvatar: "discordUserAvatar",
        },
      });
      expect(userLinkDiscordMock).toHaveBeenCalledWith(
        uid,
        "existingDiscordId",
        "discordUserAvatar"
      );
      expect(isDiscordIdAvailableMock).not.toHaveBeenCalled();
      expect(blocklistContainsMock).not.toHaveBeenCalled();
      expect(georgeLinkDiscordMock).not.toHaveBeenCalled();
      expect(addImportantLogMock).not.toHaveBeenCalled();
    });
    it("should fail for user mismatch", async () => {
      //GIVEN
      isStateValidForUserMock.mockResolvedValue(false);

      //WHEN
      const { body } = await mockApp
        .post("/users/discord/link")
        .set("Authorization", `Uid ${uid}`)
        .send({
          tokenType: "tokenType",
          accessToken: "accessToken",
          state: "statestatestatestate",
        })
        .expect(403);

      //THEN
      expect(body.message).toEqual("Invalid user token");
    });
    it("should fail for banned users", async () => {
      //GIVEN
      getUserMock.mockResolvedValue({ banned: true } as any);

      //WHEN
      const { body } = await mockApp
        .post("/users/discord/link")
        .set("Authorization", `Uid ${uid}`)
        .send({
          tokenType: "tokenType",
          accessToken: "accessToken",
          state: "statestatestatestate",
        })
        .expect(403);

      //THEN
      expect(body.message).toEqual("Banned accounts cannot link with Discord");
    });
    it("should fail for unknown discordId", async () => {
      //GIVEN
      getDiscordUserMock.mockResolvedValue({} as any);

      //WHEN
      const { body } = await mockApp
        .post("/users/discord/link")
        .set("Authorization", `Uid ${uid}`)
        .send({
          tokenType: "tokenType",
          accessToken: "accessToken",
          state: "statestatestatestate",
        })
        .expect(500);

      //THEN
      expect(body.message).toEqual(
        "Could not get Discord account info\nStack: discord id is undefined"
      );

      //THEN
      expect(userLinkDiscordMock).not.toHaveBeenCalled();
    });
    it("should fail for already linked discordId", async () => {
      //GIVEN
      isDiscordIdAvailableMock.mockResolvedValue(false);

      //WHEN
      const { body } = await mockApp
        .post("/users/discord/link")
        .set("Authorization", `Uid ${uid}`)
        .send({
          tokenType: "tokenType",
          accessToken: "accessToken",
          state: "statestatestatestate",
        })
        .expect(409);

      //THEN
      expect(body.message).toEqual(
        "This Discord account is linked to a different account"
      );

      //THEN
      expect(userLinkDiscordMock).not.toHaveBeenCalled();
    });

    it("should fail if discordId is blocked", async () => {
      //GIVEN
      const uid = mockDecodedToken.uid;
      const user = {
        uid,
        name: "name",
        email: "email",
      } as Partial<UserDal.DBUser> as UserDal.DBUser;
      getUserMock.mockResolvedValue(user);
      blocklistContainsMock.mockResolvedValue(true);

      //WHEN
      const result = await mockApp
        .post("/users/discord/link")
        .set("Authorization", "Bearer 123456789")
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
    it("should fail without mandatory properties", async () => {
      //WHEN
      const { body } = await mockApp
        .post("/users/discord/link")
        .set("Authorization", `Uid ${uid}`)
        .expect(422);

      //THEN
      expect(body).toEqual({
        message: "Invalid request data schema",
        validationErrors: [
          '"tokenType" Required',
          '"accessToken" Required',
          '"state" Required',
        ],
      });
    });
    it("should fail with unknown properties", async () => {
      //WHEN
      const { body } = await mockApp
        .post("/users/discord/link")
        .set("Authorization", `Uid ${uid}`)
        .send({
          tokenType: "tokenType",
          accessToken: "accessToken",
          state: "statestatestatestate",
          extra: "value",
        })
        .expect(422);

      //THEN
      expect(body).toEqual({
        message: "Invalid request data schema",
        validationErrors: ["Unrecognized key(s) in object: 'extra'"],
      });
    });
  });
  describe("unlink discord", () => {
    const getPartialUserMock = vi.spyOn(UserDal, "getPartialUser");
    const userUnlinkDiscordMock = vi.spyOn(UserDal, "unlinkDiscord");
    const georgeUnlinkDiscordMock = vi.spyOn(GeorgeQueue, "unlinkDiscord");
    const addImportantLogMock = vi.spyOn(LogDal, "addImportantLog");

    beforeEach(() => {
      getPartialUserMock
        .mockReset()
        .mockResolvedValue({ discordId: "discordId" } as any);
      userUnlinkDiscordMock.mockReset();
      georgeUnlinkDiscordMock.mockReset();
      addImportantLogMock.mockReset();
    });

    it("should unlink", async () => {
      //GIVEN

      //WHEN
      const { body } = await mockApp
        .post("/users/discord/unlink")
        .set("Authorization", `Uid ${uid}`)
        .expect(200);

      //THEN
      expect(body).toEqual({
        message: "Discord account unlinked",
        data: null,
      });

      expect(userUnlinkDiscordMock).toHaveBeenCalledWith(uid);
      expect(georgeUnlinkDiscordMock).toHaveBeenCalledWith("discordId", uid);
      expect(addImportantLogMock).toHaveBeenCalledWith(
        "user_discord_unlinked",
        "discordId",
        uid
      );
    });
    it("should fail for banned user", async () => {
      //GIVEN
      getPartialUserMock.mockResolvedValue({ banned: true } as any);

      //WHEN

      const { body } = await mockApp
        .post("/users/discord/unlink")
        .set("Authorization", `Uid ${uid}`)
        .expect(403);

      //THEN
      expect(body.message).toEqual("Banned accounts cannot unlink Discord");
      expect(userUnlinkDiscordMock).not.toHaveBeenCalled();
      expect(georgeUnlinkDiscordMock).not.toHaveBeenCalled();
    });
    it("should fail for user without discord linked", async () => {
      //GIVEN
      getPartialUserMock.mockResolvedValue({ discordId: undefined } as any);

      //WHEN

      const { body } = await mockApp
        .post("/users/discord/unlink")
        .set("Authorization", `Uid ${uid}`)
        .expect(404);

      //THEN
      expect(body.message).toEqual(
        "User does not have a linked Discord account"
      );
      expect(userUnlinkDiscordMock).not.toHaveBeenCalled();
      expect(georgeUnlinkDiscordMock).not.toHaveBeenCalled();
    });
  });
  describe("add result filter preset", () => {
    const validPreset = {
      _id: "66c61b7a2a65715e66a0cc95",
      name: "newPreset",
      pb: { no: true, yes: true },
      difficulty: { normal: true, expert: false, master: false },
      mode: {
        words: false,
        time: false,
        quote: true,
        zen: false,
        custom: false,
      },
      words: {
        "10": false,
        "25": false,
        "50": false,
        "100": false,
        custom: false,
      },
      time: {
        "15": false,
        "30": false,
        "60": false,
        "120": false,
        custom: false,
      },
      quoteLength: {
        short: false,
        medium: false,
        long: false,
        thicc: false,
      },
      punctuation: {
        on: false,
        off: true,
      },
      numbers: {
        on: false,
        off: true,
      },
      date: {
        last_day: false,
        last_week: false,
        last_month: false,
        last_3months: false,
        all: true,
      },
      tags: {
        none: false,
      },
      language: {
        english: true,
      },
      funbox: {
        none: true,
      },
    };
    const generatedId = new ObjectId();

    const addResultFilterPresetMock = vi.spyOn(
      UserDal,
      "addResultFilterPreset"
    );

    beforeEach(async () => {
      addResultFilterPresetMock.mockReset().mockResolvedValue(generatedId);
      await enableResultFilterPresets(true);
    });
    it("should add", async () => {
      //GIVEN

      //WHEN
      const { body } = await mockApp
        .post("/users/resultFilterPresets")
        .set("Authorization", `Uid ${uid}`)
        .send(validPreset)
        .expect(200);

      //THEN
      expect(body).toEqual({
        message: "Result filter preset created",
        data: generatedId.toHexString(),
      });

      expect(addResultFilterPresetMock).toHaveBeenCalledWith(
        uid,
        validPreset,
        (await Configuration.getLiveConfiguration()).results.filterPresets
          .maxPresetsPerUser
      );
    });
    it("should fail without mandatory properties", async () => {
      //WHEN
      const { body } = await mockApp
        .post("/users/resultFilterPresets")
        .set("Authorization", `Uid ${uid}`)
        .expect(422);

      //THEN
      expect(body).toEqual({
        message: "Invalid request data schema",
        validationErrors: [
          '"_id" Required',
          '"name" Required',
          '"pb" Required',
          '"difficulty" Required',
          '"mode" Required',
          '"words" Required',
          '"time" Required',
          '"quoteLength" Required',
          '"punctuation" Required',
          '"numbers" Required',
          '"date" Required',
          '"tags" Required',
          '"language" Required',
          '"funbox" Required',
        ],
      });
    });
    it("should fail with unknown properties", async () => {
      //WHEN
      const { body } = await mockApp
        .post("/users/resultFilterPresets")
        .set("Authorization", `Uid ${uid}`)
        .send({ ...validPreset, extra: "value" })
        .expect(422);

      //THEN
      expect(body).toEqual({
        message: "Invalid request data schema",
        validationErrors: ["Unrecognized key(s) in object: 'extra'"],
      });
    });
    it("should fail if feature is disabled", async () => {
      //GIVEN
      enableResultFilterPresets(false);
      //WHEN
      const { body } = await mockApp
        .post("/users/resultFilterPresets")
        .set("Authorization", `Uid ${uid}`)
        .send({ validPreset })
        .expect(503);

      //THEN
      expect(body.message).toEqual(
        "Result filter presets are not available at this time."
      );
    });
  });
  describe("remove result filter preset", () => {
    const removeResultFilterPresetMock = vi.spyOn(
      UserDal,
      "removeResultFilterPreset"
    );

    beforeEach(() => {
      enableResultFilterPresets(true);
      removeResultFilterPresetMock.mockReset();
    });

    it("should remove filter preset", async () => {
      //WHEN
      const { body } = await mockApp
        .delete("/users/resultFilterPresets/myId")
        .set("Authorization", `Uid ${uid}`)
        .expect(200);

      //THEN
      expect(body).toEqual({
        message: "Result filter preset deleted",
        data: null,
      });
      expect(removeResultFilterPresetMock).toHaveBeenCalledWith(uid, "myId");
    });
    it("should fail if feature is disabled", async () => {
      //GIVEN
      enableResultFilterPresets(false);

      //WHEN
      const { body } = await mockApp
        .delete("/users/resultFilterPresets/myId")
        .set("Authorization", `Uid ${uid}`)
        .expect(503);

      //THEN
      expect(body.message).toEqual(
        "Result filter presets are not available at this time."
      );
    });
  });
  describe("add tag", () => {
    const addTagMock = vi.spyOn(UserDal, "addTag");
    const newTag = {
      _id: new ObjectId(),
      name: "tagName",
      personalBests: {
        time: {},
        words: {},
        quote: {},
        zen: {},
        custom: {},
      },
    };

    beforeEach(() => {
      addTagMock.mockReset().mockResolvedValue(newTag);
    });

    it("should add tag", async () => {
      //GIVEN

      //WHEN
      const { body } = await mockApp
        .post("/users/tags")
        .send({ tagName: "tagName" })
        .set("Authorization", `Uid ${uid}`)
        .expect(200);

      //THEN
      expect(body).toEqual({
        message: "Tag updated",
        data: { ...newTag, _id: newTag._id.toHexString() },
      });
      expect(addTagMock).toHaveBeenCalledWith(uid, "tagName");
    });
    it("should fail without mandatory properties", async () => {
      //GIVEN

      //WHEN
      const { body } = await mockApp
        .post("/users/tags")
        .set("Authorization", `Uid ${uid}`)
        .expect(422);

      //THEN
      expect(body).toEqual({
        message: "Invalid request data schema",
        validationErrors: ['"tagName" Required'],
      });
    });
    it("should fail with unknown properties", async () => {
      //GIVEN

      //WHEN
      const { body } = await mockApp
        .post("/users/tags")
        .set("Authorization", `Uid ${uid}`)
        .send({ tagName: "tagName", extra: "value" })
        .expect(422);

      //THEN
      expect(body).toEqual({
        message: "Invalid request data schema",
        validationErrors: ["Unrecognized key(s) in object: 'extra'"],
      });
    });
  });
  describe("clear tag pb", () => {
    const removeTagPbMock = vi.spyOn(UserDal, "removeTagPb");

    beforeEach(() => {
      removeTagPbMock.mockReset();
    });

    it("should clear tag pb", async () => {
      //GIVEN
      const tagId = new ObjectId().toHexString();
      //WHEN
      const { body } = await mockApp
        .delete(`/users/tags/${tagId}/personalBest`)
        .set("Authorization", `Uid ${uid}`)
        .expect(200);

      //THEN
      expect(body).toEqual({
        message: "Tag PB cleared",
        data: null,
      });
      expect(removeTagPbMock).toHaveBeenLastCalledWith(uid, tagId);
    });
  });

  describe("update tag", () => {
    const editTagMock = vi.spyOn(UserDal, "editTag");
    beforeEach(() => {
      editTagMock.mockReset();
    });

    it("should update tag", async () => {
      //GIVEN
      const tagId = new ObjectId().toHexString();

      //WHEN
      const { body } = await mockApp
        .patch(`/users/tags`)
        .set("Authorization", `Uid ${uid}`)
        .send({ tagId, newName: "newName" })
        .expect(200);

      //THEN
      expect(body).toEqual({
        message: "Tag updated",
        data: null,
      });
      expect(editTagMock).toHaveBeenCalledWith(uid, tagId, "newName");
    });
    it("should fail without mandatory properties", async () => {
      //WHEN
      const { body } = await mockApp
        .patch(`/users/tags`)
        .set("Authorization", `Uid ${uid}`)
        .expect(422);

      //THEN
      expect(body).toEqual({
        message: "Invalid request data schema",
        validationErrors: ['"tagId" Required', '"newName" Required'],
      });
    });
    it("should fail with unknown properties", async () => {
      //WHEN
      const { body } = await mockApp
        .patch(`/users/tags`)
        .set("Authorization", `Uid ${uid}`)
        .send({
          tagId: new ObjectId().toHexString(),
          newName: "newName",
          extra: "value",
        })
        .expect(422);

      //THEN
      expect(body).toEqual({
        message: "Invalid request data schema",
        validationErrors: ["Unrecognized key(s) in object: 'extra'"],
      });
    });
  });
  describe("remove tag", () => {
    const removeTagMock = vi.spyOn(UserDal, "removeTag");

    beforeEach(() => {
      removeTagMock.mockReset();
    });

    it("should remove tag", async () => {
      //GIVEN
      const tagId = new ObjectId().toHexString();

      //WHEN
      const { body } = await mockApp
        .delete(`/users/tags/${tagId}`)
        .set("Authorization", `Uid ${uid}`)
        .expect(200);

      //THEN
      expect(body).toEqual({
        message: "Tag deleted",
        data: null,
      });

      expect(removeTagMock).toHaveBeenCalledWith(uid, tagId);
    });
  });
  describe("get tags", () => {
    const getTagsMock = vi.spyOn(UserDal, "getTags");

    beforeEach(() => {
      getTagsMock.mockReset();
    });

    it("should get tags", async () => {
      //GIVEN
      const tagOne: UserDal.DBUserTag = {
        _id: new ObjectId(),
        name: "tagOne",
        personalBests: {} as any,
      };
      const tagTwo: UserDal.DBUserTag = {
        _id: new ObjectId(),
        name: "tagOne",
        personalBests: {} as any,
      };

      getTagsMock.mockResolvedValue([tagOne, tagTwo]);

      //WHEN
      const { body } = await mockApp
        .get("/users/tags")
        .set("Authorization", `Uid ${uid}`)
        .expect(200);

      //THEN
      expect(body).toEqual({
        message: "Tags retrieved",
        data: [
          { ...tagOne, _id: tagOne._id.toHexString() },
          { ...tagTwo, _id: tagTwo._id.toHexString() },
        ],
      });
      expect(getTagsMock).toHaveBeenCalledWith(uid);
    });
  });
  describe("update lb memory", () => {
    const updateLbMemoryMock = vi.spyOn(UserDal, "updateLbMemory");
    beforeEach(() => {
      updateLbMemoryMock.mockReset();
    });

    it("should update lb ", async () => {
      //WHEN
      const { body } = await mockApp
        .patch("/users/leaderboardMemory")
        .send({
          mode: "time",
          mode2: "60",
          language: "english",
          rank: 7,
        })
        .set("Authorization", `Uid ${uid}`)
        .expect(200);

      //THEN
      expect(body).toEqual({
        message: "Leaderboard memory updated",
        data: null,
      });

      expect(updateLbMemoryMock).toHaveBeenCalledWith(
        uid,
        "time",
        "60",
        "english",
        7
      );
    });

    it("should fail without mandatory properties", async () => {
      //WHEN
      const { body } = await mockApp
        .patch("/users/leaderboardMemory")
        .set("Authorization", `Uid ${uid}`)
        .expect(422);

      //THEN
      expect(body).toEqual({
        message: "Invalid request data schema",
        validationErrors: [
          '"mode" Required',
          '"mode2" Needs to be either a number, "zen" or "custom".',
          '"language" Required',
          '"rank" Required',
        ],
      });
    });
    it("should fail with unknown properties", async () => {
      //WHEN
      const { body } = await mockApp
        .patch("/users/leaderboardMemory")
        .set("Authorization", `Uid ${uid}`)
        .send({
          mode: "time",
          mode2: "60",
          language: "english",
          rank: 7,
          extra: "value",
        })
        .expect(422);

      //THEN
      expect(body).toEqual({
        message: "Invalid request data schema",
        validationErrors: ["Unrecognized key(s) in object: 'extra'"],
      });
    });
  });
  describe("get custom themes", () => {
    const getThemesMock = vi.spyOn(UserDal, "getThemes");
    beforeEach(() => {
      getThemesMock.mockReset();
    });
    it("should get custom themes", async () => {
      //GIVEN
      const themeOne: UserDal.DBCustomTheme = {
        _id: new ObjectId(),
        name: "themeOne",
        colors: new Array(10).fill("#000000") as any,
      };
      const themeTwo: UserDal.DBCustomTheme = {
        _id: new ObjectId(),
        name: "themeTwo",
        colors: new Array(10).fill("#FFFFFF") as any,
      };
      getThemesMock.mockResolvedValue([themeOne, themeTwo]);

      //WHEN
      const { body } = await mockApp
        .get("/users/customThemes")
        .set("Authorization", `Uid ${uid}`)
        .expect(200);

      //THEN
      expect(body).toEqual({
        message: "Custom themes retrieved",
        data: [
          { ...themeOne, _id: themeOne._id.toHexString() },
          { ...themeTwo, _id: themeTwo._id.toHexString() },
        ],
      });
    });
  });
  describe("add custom theme", () => {
    const addThemeMock = vi.spyOn(UserDal, "addTheme");
    beforeEach(() => {
      addThemeMock.mockReset();
    });

    it("should add ", async () => {
      //GIVEN
      const addedTheme: UserDal.DBCustomTheme = {
        _id: new ObjectId(),
        name: "custom",
        colors: new Array(10).fill("#000000") as any,
      };
      addThemeMock.mockResolvedValue(addedTheme);

      //WHEN
      const { body } = await mockApp
        .post("/users/customThemes")
        .set("Authorization", `Uid ${uid}`)
        .send({
          name: "customTheme",
          colors: new Array(10).fill("#000000") as any,
        })
        .expect(200);

      //THEN
      expect(body).toEqual({
        message: "Custom theme added",
        data: { ...addedTheme, _id: addedTheme._id.toHexString() },
      });
      expect(addThemeMock).toHaveBeenCalledWith(uid, {
        name: "customTheme",
        colors: new Array(10).fill("#000000") as any,
      });
    });
    it("should fail without mandatory properties", async () => {
      //WHEN
      const { body } = await mockApp
        .post("/users/customThemes")
        .set("Authorization", `Uid ${uid}`)
        .expect(422);

      //THEN
      expect(body).toEqual({
        message: "Invalid request data schema",
        validationErrors: ['"name" Required', '"colors" Required'],
      });
    });
    it("should fail with unknown properties", async () => {
      //WHEN
      const { body } = await mockApp
        .post("/users/customThemes")
        .set("Authorization", `Uid ${uid}`)
        .send({
          name: "customTheme",
          colors: new Array(10).fill("#000000") as any,
          extra: "value",
        })
        .expect(422);

      //THEN
      expect(body).toEqual({
        message: "Invalid request data schema",
        validationErrors: ["Unrecognized key(s) in object: 'extra'"],
      });
    });
    it("should fail with invalid properties", async () => {
      //WHEN
      const { body } = await mockApp
        .post("/users/customThemes")
        .set("Authorization", `Uid ${uid}`)
        .send({
          name: "customThemecustomThemecustomThemecustomTheme",
          colors: new Array(9).fill("#000") as any,
        })
        .expect(422);

      //THEN
      expect(body).toEqual({
        message: "Invalid request data schema",
        validationErrors: [
          '"name" String must contain at most 16 character(s)',
          '"colors" Array must contain at least 10 element(s)',
        ],
      });
    });
  });
  describe("remove custom theme", () => {
    const removeThemeMock = vi.spyOn(UserDal, "removeTheme");

    beforeEach(() => {
      removeThemeMock.mockReset();
    });

    it("should remove theme", async () => {
      //GIVEN
      const themeId = new ObjectId().toHexString();

      //WHEN
      const { body } = await mockApp
        .delete("/users/customThemes")
        .set("Authorization", `Uid ${uid}`)
        .send({ themeId })
        .expect(200);

      //THEN
      expect(body).toEqual({
        message: "Custom theme removed",
        data: null,
      });
      expect(removeThemeMock).toHaveBeenCalledWith(uid, themeId);
    });
    it("should fail without mandatory properties", async () => {
      //WHEN
      const { body } = await mockApp
        .delete("/users/customThemes")
        .set("Authorization", `Uid ${uid}`)
        .expect(422);

      //THEN
      expect(body).toEqual({
        message: "Invalid request data schema",
        validationErrors: ['"themeId" Required'],
      });
    });
    it("should fail with unknown properties", async () => {
      //WHEN
      const { body } = await mockApp
        .delete("/users/customThemes")
        .set("Authorization", `Uid ${uid}`)
        .send({ themeId: new ObjectId().toHexString(), extra: "value" })
        .expect(422);

      //THEN
      expect(body).toEqual({
        message: "Invalid request data schema",
        validationErrors: ["Unrecognized key(s) in object: 'extra'"],
      });
    });
  });
  describe("edit custom theme", () => {
    const editThemeMock = vi.spyOn(UserDal, "editTheme");
    beforeEach(() => {
      editThemeMock.mockReset();
    });

    it("should edit custom theme", async () => {
      //GIVEN
      const themeId = new ObjectId().toHexString();
      const theme = {
        name: "newName",
        colors: new Array(10).fill("#000000") as any,
      };

      //WHEN
      const { body } = await mockApp
        .patch("/users/customThemes")
        .set("Authorization", `Uid ${uid}`)
        .send({
          themeId,
          theme,
        })
        .expect(200);

      //THEN
      expect(body).toEqual({
        message: "Custom theme updated",
        data: null,
      });
      expect(editThemeMock).toHaveBeenCalledWith(uid, themeId, theme);
    });
    it("should fail without mandatory properties", async () => {
      //WHEN
      const { body } = await mockApp
        .patch("/users/customThemes")
        .set("Authorization", `Uid ${uid}`)
        .expect(422);

      //THEN
      expect(body).toEqual({
        message: "Invalid request data schema",
        validationErrors: ['"themeId" Required', '"theme" Required'],
      });
    });
    it("should fail with unknown properties", async () => {
      //WHEN
      const { body } = await mockApp
        .patch("/users/customThemes")
        .set("Authorization", `Uid ${uid}`)
        .send({
          themeId: new ObjectId().toHexString(),
          theme: {
            name: "newName",
            colors: new Array(10).fill("#000000") as any,
            extra2: "value",
          },
          extra: "value",
        })
        .expect(422);

      //THEN
      expect(body).toEqual({
        message: "Invalid request data schema",
        validationErrors: [
          `"theme" Unrecognized key(s) in object: 'extra2'`,
          "Unrecognized key(s) in object: 'extra'",
        ],
      });
    });
  });
  describe("get personal bests", () => {
    const getPBMock = vi.spyOn(UserDal, "getPersonalBests");
    beforeEach(() => {
      getPBMock.mockReset();
    });

    it("should get pbs", async () => {
      //GIVEN
      const personalBest: PersonalBest = pb(15);
      getPBMock.mockResolvedValue(personalBest);

      //WHEN
      const { body } = await mockApp
        .get("/users/personalBests")
        .set("Authorization", `Uid ${uid}`)
        .query({ mode: "time", mode2: "15" })
        .expect(200);

      //THEN
      expect(body).toEqual({
        message: "Personal bests retrieved",
        data: personalBest,
      });
      expect(getPBMock).toHaveBeenCalledWith(uid, "time", "15");
    });
    it("should get pbs with ape key", async () => {
      //GIVEN
      await acceptApeKeys(true);
      const apeKey = await mockAuthenticateWithApeKey(uid, await configuration);

      //WHEN
      await mockApp
        .get("/users/personalBests")
        .set("authorization", `ApeKey ${apeKey}`)
        .query({ mode: "time", mode2: "15" })
        .expect(200);
    });
    it("should fail without mandatory query parameters", async () => {
      //WHEN
      const { body } = await mockApp
        .get("/users/personalBests")
        .set("Authorization", `Uid ${uid}`)
        .expect(422);

      //THEN
      expect(body).toEqual({
        message: "Invalid query schema",
        validationErrors: ['"mode" Required'],
      });
    });
    it("should fail with unknown query parameters", async () => {
      //WHEN
      const { body } = await mockApp
        .get("/users/personalBests")
        .set("Authorization", `Uid ${uid}`)
        .query({ mode: "time", mode2: "15", extra: "value" })
        .expect(422);

      //THEN
      expect(body).toEqual({
        message: "Invalid query schema",
        validationErrors: ["Unrecognized key(s) in object: 'extra'"],
      });
    });
    it("should fail with invalid query parameters", async () => {
      //WHEN
      const { body } = await mockApp
        .get("/users/personalBests")
        .set("Authorization", `Uid ${uid}`)
        .query({ mode: "mood", mode2: "happy" })

        .expect(422);

      //THEN
      expect(body).toEqual({
        message: "Invalid query schema",
        validationErrors: [
          `"mode" Invalid enum value. Expected 'time' | 'words' | 'quote' | 'custom' | 'zen', received 'mood'`,
          `"mode2" Needs to be a number or a number represented as a string e.g. "10".`,
        ],
      });
    });
  });
  describe("get stats", () => {
    const getStatsMock = vi.spyOn(UserDal, "getStats");
    beforeEach(() => {
      getStatsMock.mockReset();
    });

    it("should get stats", async () => {
      //GIVEN
      const stats: Pick<
        UserDal.DBUser,
        "startedTests" | "completedTests" | "timeTyping"
      > = {
        startedTests: 5,
        completedTests: 3,
        timeTyping: 42,
      };
      getStatsMock.mockResolvedValue(stats);

      //WHEN
      const { body } = await mockApp
        .get("/users/stats")
        .set("Authorization", `Uid ${uid}`)
        .expect(200);

      //THEN
      expect(body).toEqual({
        message: "Personal stats retrieved",
        data: stats,
      });

      expect(getStatsMock).toHaveBeenCalledWith(uid);
    });
    it("should get stats with ape key", async () => {
      //GIVEN
      await acceptApeKeys(true);
      const apeKey = await mockAuthenticateWithApeKey(uid, await configuration);

      //WHEN
      await mockApp
        .get("/users/stats")
        .set("authorization", `ApeKey ${apeKey}`)
        .expect(200);
    });
  });
  describe("get favorite quotes", () => {
    const getFavoriteQuotesMock = vi.spyOn(UserDal, "getFavoriteQuotes");
    beforeEach(() => {
      getFavoriteQuotesMock.mockReset();
    });

    it("should get favorite quites", async () => {
      //GIVEN
      const favoriteQuotes = {
        english: ["1", "2"],
        german: ["1", "3"],
      };
      getFavoriteQuotesMock.mockResolvedValue(favoriteQuotes);

      //WHEN
      const { body } = await mockApp
        .get("/users/favoriteQuotes")
        .set("Authorization", `Uid ${uid}`)
        .expect(200);

      //THEN
      expect(body).toEqual({
        message: "Favorite quotes retrieved",
        data: favoriteQuotes,
      });
      expect(getFavoriteQuotesMock).toHaveBeenCalledWith(uid);
    });
  });
  describe("add favorite quotes", () => {
    const addFavoriteQuoteMock = vi.spyOn(UserDal, "addFavoriteQuote");
    beforeEach(() => {
      addFavoriteQuoteMock.mockReset();
    });
    it("should add", async () => {
      //WHEN
      const { body } = await mockApp
        .post("/users/favoriteQuotes")
        .set("Authorization", `Uid ${uid}`)
        .send({ language: "english", quoteId: "7" })
        .expect(200);

      //THEN
      expect(body).toEqual({
        message: "Quote added to favorites",
        data: null,
      });
      expect(addFavoriteQuoteMock).toHaveBeenCalledWith(
        uid,
        "english",
        "7",
        (await Configuration.getLiveConfiguration()).quotes.maxFavorites
      );
    });
    it("should fail without mandatory properties", async () => {
      //WHEN
      const { body } = await mockApp
        .post("/users/favoriteQuotes")
        .set("Authorization", `Uid ${uid}`)
        .expect(422);

      //THEN
      expect(body).toEqual({
        message: "Invalid request data schema",
        validationErrors: ['"language" Required', '"quoteId" Invalid input'],
      });
    });
    it("should fail unknown properties", async () => {
      //WHEN
      const { body } = await mockApp
        .post("/users/favoriteQuotes")
        .set("Authorization", `Uid ${uid}`)
        .send({ language: "english", quoteId: "7", extra: "value" })
        .expect(422);

      //THEN
      expect(body).toEqual({
        message: "Invalid request data schema",
        validationErrors: ["Unrecognized key(s) in object: 'extra'"],
      });
    });
  });
  describe("remove favorite quote", () => {
    const removeFavoriteQuoteMock = vi.spyOn(UserDal, "removeFavoriteQuote");
    beforeEach(() => {
      removeFavoriteQuoteMock.mockReset();
    });

    it("should remove quote", async () => {
      //WHEN
      const { body } = await mockApp
        .delete("/users/favoriteQuotes")
        .set("Authorization", `Uid ${uid}`)
        .send({ language: "english", quoteId: "7" })
        .expect(200);

      //THEN
      expect(body).toEqual({
        message: "Quote removed from favorites",
        data: null,
      });
      expect(removeFavoriteQuoteMock).toHaveBeenCalledWith(uid, "english", "7");
    });
    it("should fail without mandatory properties", async () => {
      //WHEN
      const { body } = await mockApp
        .delete("/users/favoriteQuotes")
        .set("Authorization", `Uid ${uid}`)
        .expect(422);

      //THEN
      expect(body).toEqual({
        message: "Invalid request data schema",
        validationErrors: ['"language" Required', '"quoteId" Invalid input'],
      });
    });
    it("should fail unknown properties", async () => {
      //WHEN
      const { body } = await mockApp
        .delete("/users/favoriteQuotes")
        .set("Authorization", `Uid ${uid}`)
        .send({ language: "english", quoteId: "7", extra: "value" })
        .expect(422);

      //THEN
      expect(body).toEqual({
        message: "Invalid request data schema",
        validationErrors: ["Unrecognized key(s) in object: 'extra'"],
      });
    });
  });
  describe("get profile", () => {
    const getUserMock = vi.spyOn(UserDal, "getUser");
    const getUserByNameMock = vi.spyOn(UserDal, "getUserByName");
    const checkIfUserIsPremiumMock = vi.spyOn(UserDal, "checkIfUserIsPremium");
    const leaderboardGetRankMock = vi.spyOn(LeaderboardDal, "getRank");

    const foundUser: Partial<UserDal.DBUser> = {
      _id: new ObjectId(),
      uid: new ObjectId().toHexString(),
      name: "bob",
      banned: false,
      inventory: { badges: [{ id: 1, selected: true }, { id: 2 }] },
      profileDetails: {
        bio: "bio",
        keyboard: "keyboard",
        socialProfiles: {
          twitter: "twitter",
          github: "github",
        },
      },
      personalBests: {
        time: {
          "15": [pb(15), pb(16)],
          "30": [pb(30), pb(31)],
          "60": [pb(60), pb(61)],
          "120": [pb(120), pb(121)],
          "42": [pb(42), pb(43)],
        },
        words: {
          "10": [pb(10), pb(11)],
          "25": [pb(25), pb(26)],
          "50": [pb(50), pb(51)],
          "100": [pb(100), pb(101)],
          "42": [pb(42), pb(43)],
        },
        custom: {},
        zen: {},
        quote: {},
      },
      completedTests: 23,
      startedTests: 42,
      timeTyping: 234,
      addedAt: 1000,
      discordId: "discordId",
      discordAvatar: "discordAvatar",
      xp: 10,
      streak: { length: 2, lastResultTimestamp: 2000, maxLength: 5 },
      lbOptOut: false,
      bananas: 47, //should get removed
    };

    beforeEach(async () => {
      getUserMock.mockReset();
      getUserByNameMock.mockReset();
      checkIfUserIsPremiumMock.mockReset().mockResolvedValue(true);
      leaderboardGetRankMock.mockReset();
      await enableProfiles(true);
    });

    it("should get by name without authentication", async () => {
      //GIVEN
      getUserByNameMock.mockResolvedValue(foundUser as any);

      const rank: LeaderboardRank = { count: 100, rank: 24 };
      leaderboardGetRankMock.mockResolvedValue(rank);

      //WHEN
      const { body } = await mockApp.get("/users/bob/profile").expect(200);

      //THEN
      expect(body).toEqual({
        message: "Profile retrieved",
        data: {
          uid: foundUser.uid,
          name: "bob",
          banned: false,
          addedAt: 1000,
          typingStats: {
            completedTests: 23,
            startedTests: 42,
            timeTyping: 234,
          },
          personalBests: {
            time: {
              "15": foundUser.personalBests?.time["15"],
              "30": foundUser.personalBests?.time["30"],
              "60": foundUser.personalBests?.time["60"],
              "120": foundUser.personalBests?.time["120"],
            },
            words: {
              "10": foundUser.personalBests?.words["10"],
              "25": foundUser.personalBests?.words["25"],
              "50": foundUser.personalBests?.words["50"],
              "100": foundUser.personalBests?.words["100"],
            },
          },

          discordId: "discordId",
          discordAvatar: "discordAvatar",
          xp: 10,
          streak: 2,
          maxStreak: 5,
          lbOptOut: false,
          isPremium: true,
          allTimeLbs: {
            time: {
              "15": { english: { count: 100, rank: 24 } },
              "60": { english: { count: 100, rank: 24 } },
            },
          },
          inventory: foundUser.inventory,
          details: foundUser.profileDetails,
        },
      });
      expect(getUserByNameMock).toHaveBeenCalledWith("bob", "get user profile");
      expect(getUserMock).not.toHaveBeenCalled();
    });
    it("should get base profile for banned user", async () => {
      //GIVEN
      getUserByNameMock.mockResolvedValue({
        ...foundUser,
        banned: true,
      } as any);

      const rank: LeaderboardRank = { count: 100, rank: 24 };
      leaderboardGetRankMock.mockResolvedValue(rank);

      //WHEN
      const { body } = await mockApp.get("/users/bob/profile").expect(200);

      //THEN
      expect(body).toEqual({
        message: "Profile retrived: banned user",
        data: {
          name: "bob",
          banned: true,
          addedAt: 1000,
          typingStats: {
            completedTests: 23,
            startedTests: 42,
            timeTyping: 234,
          },
          personalBests: {
            time: {
              "15": foundUser.personalBests?.time["15"],
              "30": foundUser.personalBests?.time["30"],
              "60": foundUser.personalBests?.time["60"],
              "120": foundUser.personalBests?.time["120"],
            },
            words: {
              "10": foundUser.personalBests?.words["10"],
              "25": foundUser.personalBests?.words["25"],
              "50": foundUser.personalBests?.words["50"],
              "100": foundUser.personalBests?.words["100"],
            },
          },

          discordId: "discordId",
          discordAvatar: "discordAvatar",
          xp: 10,
          streak: 2,
          maxStreak: 5,
          lbOptOut: false,
          isPremium: true,
        },
      });
      expect(getUserByNameMock).toHaveBeenCalledWith("bob", "get user profile");
      expect(getUserMock).not.toHaveBeenCalled();
    });
    it("should get by uid without authentication", async () => {
      //GIVEN
      const uid = foundUser.uid;
      getUserMock.mockResolvedValue(foundUser as any);

      const rank: LeaderboardRank = { count: 100, rank: 24 };
      leaderboardGetRankMock.mockResolvedValue(rank);

      //WHEN
      const { body } = await mockApp
        .get(`/users/${uid}/profile`)
        .query({ isUid: "" })
        .expect(200);

      //THEN
      expect(body).toEqual({
        message: "Profile retrieved",
        data: expect.objectContaining({
          uid: foundUser.uid,
        }),
      });
      expect(getUserByNameMock).not.toHaveBeenCalled();
      expect(getUserMock).toHaveBeenCalledWith(uid, "get user profile");
    });
    it("should fail if feature is disabled", async () => {
      //GIVEN
      await enableProfiles(false);

      //WHEN
      const { body } = await mockApp.get(`/users/bob/profile`).expect(503);

      //THEN
      expect(body.message).toEqual("Profiles are not available at this time");
    });
  });
  describe("update profile", () => {
    const getPartialUserMock = vi.spyOn(UserDal, "getPartialUser");
    const updateProfileMock = vi.spyOn(UserDal, "updateProfile");

    beforeEach(async () => {
      getPartialUserMock.mockReset().mockResolvedValue({
        inventory: {
          badges: [{ id: 4, selected: true }, { id: 2 }, { id: 3 }],
        },
      } as any);
      updateProfileMock.mockReset();
      await enableProfiles(true);
    });

    it("should update", async () => {
      //GIVEN
      const newProfile = {
        bio: "newBio",
        keyboard: "newKeyboard",

        socialProfiles: {
          github: "github",
          twitter: "twitter",
          website: "https://monkeytype.com",
        },
      };

      //WHEN
      const { body } = await mockApp
        .patch("/users/profile")
        .set("Authorization", `Uid ${uid}`)
        .send({
          ...newProfile,
          selectedBadgeId: 2,
        })
        .expect(200);

      //THEN
      expect(body).toEqual({
        message: "Profile updated",
        data: newProfile,
      });
      expect(updateProfileMock).toHaveBeenCalledWith(
        uid,
        {
          bio: "newBio",
          keyboard: "newKeyboard",
          socialProfiles: {
            github: "github",
            twitter: "twitter",
            website: "https://monkeytype.com",
          },
        },
        {
          badges: [{ id: 4 }, { id: 2, selected: true }, { id: 3 }],
        }
      );
    });
    it("should update with empty strings", async () => {
      //GIVEN
      const newProfile = {
        bio: "",
        keyboard: "",

        socialProfiles: {
          github: "",
          twitter: "",
          website: "",
        },
      };

      //WHEN
      const { body } = await mockApp
        .patch("/users/profile")
        .set("Authorization", `Uid ${uid}`)
        .send({
          ...newProfile,
          selectedBadgeId: -1,
        })
        .expect(200);

      //THEN
      expect(body).toEqual({
        message: "Profile updated",
        data: newProfile,
      });
      expect(updateProfileMock).toHaveBeenCalledWith(
        uid,
        {
          bio: "",
          keyboard: "",
          socialProfiles: {
            github: "",
            twitter: "",
            website: "",
          },
        },
        {
          badges: [{ id: 4 }, { id: 2 }, { id: 3 }],
        }
      );
    });
    it("should fail with unknown properties", async () => {
      //WHEN
      const { body } = await mockApp
        .patch("/users/profile")
        .set("Authorization", `Uid ${uid}`)
        .send({
          extra: "value",
          socialProfiles: {
            extra2: "value",
          },
        })
        .expect(422);

      //THEN
      expect(body).toEqual({
        message: "Invalid request data schema",
        validationErrors: [
          `"socialProfiles" Unrecognized key(s) in object: 'extra2'`,
          "Unrecognized key(s) in object: 'extra'",
        ],
      });
    });
    it("should sanitize inputs", async () => {
      //WHEN
      await mockApp
        .patch("/users/profile")
        .set("Authorization", `Uid ${uid}`)
        .send({
          bio: "Line1\n\n\nLine2\n\n\n\nLine3",
          keyboard: "  string     with      many      spaces      ",
        })
        .expect(200);

      //THEN
      expect(updateProfileMock).toHaveBeenCalledWith(
        uid,
        {
          bio: "Line1\n\nLine2\n\nLine3",
          keyboard: "string  with  many  spaces",
          socialProfiles: {},
        },
        expect.objectContaining({})
      );
    });
    it("should fail with profanity", async () => {
      //WHEN
      const { body } = await mockApp
        .patch("/users/profile")
        .set("Authorization", `Uid ${uid}`)
        .send({
          bio: "miodec",
          keyboard: "miodec",
          socialProfiles: {
            twitter: "miodec",
            github: "miodec",
            website: "https://i-luv-miodec.com",
          },
        })
        .expect(422);

      //THEN
      expect(body).toEqual({
        message: "Invalid request data schema",
        validationErrors: [
          '"bio" Profanity detected. Please remove it. If you believe this is a mistake, please contact us. (miodec)',
          '"keyboard" Profanity detected. Please remove it. If you believe this is a mistake, please contact us. (miodec)',
          '"socialProfiles.twitter" Profanity detected. Please remove it. If you believe this is a mistake, please contact us. (miodec)',
          '"socialProfiles.github" Profanity detected. Please remove it. If you believe this is a mistake, please contact us. (miodec)',
          '"socialProfiles.website" Profanity detected. Please remove it. If you believe this is a mistake, please contact us. (https://i-luv-miodec.com)',
        ],
      });
    });
    it("should fail with properties exceeding max lengths", async () => {
      //WHEN
      const { body } = await mockApp
        .patch("/users/profile")
        .set("Authorization", `Uid ${uid}`)
        .send({
          bio: new Array(251).fill("x").join(""),
          keyboard: new Array(76).fill("x").join(""),
          socialProfiles: {
            twitter: new Array(21).fill("x").join(""),
            github: new Array(40).fill("x").join(""),
            website:
              "https://" +
              new Array(201 - "https://".length).fill("x").join(""),
          },
        })
        .expect(422);

      //THEN
      expect(body).toEqual({
        message: "Invalid request data schema",
        validationErrors: [
          '"bio" String must contain at most 250 character(s)',
          '"keyboard" String must contain at most 75 character(s)',
          '"socialProfiles.twitter" String must contain at most 20 character(s)',
          '"socialProfiles.github" String must contain at most 39 character(s)',
          '"socialProfiles.website" String must contain at most 200 character(s)',
        ],
      });
    });
    it("should fail with website not using https", async () => {
      //WHEN
      const { body } = await mockApp
        .patch("/users/profile")
        .set("Authorization", `Uid ${uid}`)
        .send({
          socialProfiles: {
            website: "http://monkeytype.com",
          },
        })
        .expect(422);

      //THEN
      expect(body).toEqual({
        message: "Invalid request data schema",
        validationErrors: [
          '"socialProfiles.website" Invalid input: must start with "https://"',
        ],
      });
    });
    it("should fail if feature is disabled", async () => {
      //GIVEN
      await enableProfiles(false);

      //WHEN
      const { body } = await mockApp
        .patch("/users/profile")
        .set("Authorization", `Uid ${uid}`)
        .send({})
        .expect(503);

      //THEN
      expect(body.message).toEqual("Profiles are not available at this time");
    });
  });
  describe("get inbox", () => {
    const getInboxMock = vi.spyOn(UserDal, "getInbox");

    beforeEach(async () => {
      getInboxMock.mockReset();
      await enableInbox(true);
    });

    it("shold get inbox", async () => {
      //GIVEN
      const mailOne: MonkeyMail = {
        id: randomUUID(),
        subject: "subjectOne",
        body: "bodyOne",
        timestamp: 100,
        read: false,
        rewards: [],
      };
      const mailTwo: MonkeyMail = {
        id: randomUUID(),
        subject: "subjectTwo",
        body: "bodyTwo",
        timestamp: 100,
        read: false,
        rewards: [],
      };
      getInboxMock.mockResolvedValue([mailOne, mailTwo]);

      //WHEN
      const { body } = await mockApp
        .get("/users/inbox")
        .set("Authorization", `Uid ${uid}`)
        .expect(200);

      //THEN
      expect(body).toEqual({
        message: "Inbox retrieved",
        data: {
          inbox: [mailOne, mailTwo],
          maxMail: (await Configuration.getLiveConfiguration()).users.inbox
            .maxMail,
        },
      });
      expect(getInboxMock).toHaveBeenCalledWith(uid);
    });
    it("should fail if feature is disabled", async () => {
      //GIVEN
      await enableInbox(false);

      //WHEN
      const { body } = await mockApp
        .get("/users/inbox")
        .set("Authorization", `Uid ${uid}`)
        .expect(503);

      //THEN
      expect(body.message).toEqual("Your inbox is not available at this time.");
    });
  });
  describe("update inbox", () => {
    const updateInboxMock = vi.spyOn(UserDal, "updateInbox");
    const mailIdOne = randomUUID();
    const mailIdTwo = randomUUID();
    beforeEach(async () => {
      updateInboxMock.mockReset();
      await enableInbox(true);
    });

    it("should update", async () => {
      //WHEN
      const { body } = await mockApp
        .patch("/users/inbox")
        .set("Authorization", `Uid ${uid}`)
        .send({
          mailIdsToDelete: [mailIdOne],
          mailIdsToMarkRead: [mailIdOne, mailIdTwo],
        })
        .expect(200);

      //THEN
      expect(body).toEqual({
        message: "Inbox updated",
        data: null,
      });

      expect(updateInboxMock).toHaveBeenCalledWith(
        uid,
        [mailIdOne, mailIdTwo],
        [mailIdOne]
      );
    });
    it("should update without body", async () => {
      //WHEN
      const { body } = await mockApp
        .patch("/users/inbox")
        .set("Authorization", `Uid ${uid}`);
      //.expect(200);
      console.log(body);

      //THEN
      expect(body).toEqual({
        message: "Inbox updated",
        data: null,
      });

      expect(updateInboxMock).toHaveBeenCalledWith(uid, [], []);
    });
    it("should fail with empty arrays", async () => {
      //WHEN
      const { body } = await mockApp
        .patch("/users/inbox")
        .set("Authorization", `Uid ${uid}`)
        .send({
          mailIdsToDelete: [],
          mailIdsToMarkRead: [],
        })
        .expect(422);

      //THEN
      expect(body).toEqual({
        message: "Invalid request data schema",
        validationErrors: [
          '"mailIdsToDelete" Array must contain at least 1 element(s)',
          '"mailIdsToMarkRead" Array must contain at least 1 element(s)',
        ],
      });
    });
    it("should fail if feature is disabled", async () => {
      //GIVEN
      await enableInbox(false);

      //WHEN
      const { body } = await mockApp
        .patch("/users/inbox")
        .set("Authorization", `Uid ${uid}`)
        .expect(503);

      //THEN
      expect(body.message).toEqual("Your inbox is not available at this time.");
    });
  });
  describe("report user", () => {
    const createReportMock = vi.spyOn(ReportDal, "createReport");
    const verifyCaptchaMock = vi.spyOn(Captcha, "verify");
    const getPartialUserMock = vi.spyOn(UserDal, "getPartialUser"); //todo replace with getPartialUser
    beforeEach(async () => {
      vi.useFakeTimers();
      vi.setSystemTime(125000);
      createReportMock.mockReset().mockResolvedValue();
      verifyCaptchaMock.mockReset().mockResolvedValue(true);
      getPartialUserMock.mockReset().mockResolvedValue({} as any);

      await enableReporting(true);
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it("should report", async () => {
      //WHEN
      const uidToReport = new ObjectId().toHexString();

      const { body } = await mockApp
        .post("/users/report")
        .set("Authorization", `Uid ${uid}`)
        .send({
          uid: uidToReport,
          reason: "Suspected cheating",
          comment: "comment",
          captcha: "captcha",
        })
        .expect(200);

      //THEN
      expect(body).toEqual({
        message: "User reported",
        data: null,
      });
      expect(createReportMock).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "user",
          timestamp: 125000,
          uid,
          contentId: uidToReport,
          reason: "Suspected cheating",
          comment: "comment",
        }),
        (await Configuration.getLiveConfiguration()).quotes.reporting
          .maxReports,
        (await Configuration.getLiveConfiguration()).quotes.reporting
          .contentReportLimit
      );
      expect(verifyCaptchaMock).toHaveBeenCalledWith("captcha");
    });
    it("should fail without mandatory properties", async () => {
      //WHEN
      const { body } = await mockApp
        .post("/users/report")
        .set("Authorization", `Uid ${uid}`)
        .expect(422);

      //THEN
      expect(body).toEqual({
        message: "Invalid request data schema",
        validationErrors: [
          '"uid" Required',
          '"reason" Required',
          '"captcha" Required',
        ],
      });
    });
    it("should fail with unknown properties", async () => {
      //WHEN
      const { body } = await mockApp
        .post("/users/report")
        .set("Authorization", `Uid ${uid}`)
        .send({
          uid: new ObjectId().toHexString(),
          reason: "Suspected cheating",
          comment: "comment",
          captcha: "captcha",
          extra: "value",
        })
        .expect(422);

      //THEN
      expect(body).toEqual({
        message: "Invalid request data schema",
        validationErrors: ["Unrecognized key(s) in object: 'extra'"],
      });
    });
    it("should fail with invalid captcha", async () => {
      //GIVEN
      verifyCaptchaMock.mockResolvedValue(false);

      //WHEN
      const { body } = await mockApp
        .post("/users/report")
        .set("Authorization", `Uid ${uid}`)
        .send({
          uid: new ObjectId().toHexString(),
          reason: "Suspected cheating",
          comment: "comment",
          captcha: "captcha",
        })
        .expect(422);

      //THEN
      expect(body.message).toEqual("Captcha challenge failed");
      /* TODO
      expect(body).toEqual({});
      */
    });
    it("should fail with invalid properties", async () => {
      //WHEN
      const { body } = await mockApp
        .post("/users/report")
        .set("Authorization", `Uid ${uid}`)
        .send({
          uid: new Array(51).fill("x").join(""),
          reason: "unfriendly",
          comment: new Array(251).fill("x").join(""),
          captcha: "captcha",
        })
        .expect(422);

      //THEN
      expect(body).toEqual({
        message: "Invalid request data schema",
        validationErrors: [
          `"reason" Invalid enum value. Expected 'Inappropriate name' | 'Inappropriate bio' | 'Inappropriate social links' | 'Suspected cheating', received 'unfriendly'`,
          '"comment" String must contain at most 250 character(s)',
        ],
      });
    });
    it("should fail if user can not report", async () => {
      //GIVEN
      getPartialUserMock.mockResolvedValue({ canReport: false } as any);

      //WHEN
      const { body } = await mockApp
        .post("/users/report")
        .set("Authorization", `Uid ${uid}`)
        .send({
          uid: new ObjectId().toHexString(),
          reason: "Suspected cheating",
          comment: "comment",
          captcha: "captcha",
        })
        .expect(403);

      //THEN
      expect(body.message).toEqual("You don't have permission to do this.");
    });
    it("should fail if feature is disabled", async () => {
      //GIVEN
      await enableReporting(false);

      //WHEN
      const { body } = await mockApp
        .post("/users/report")
        .set("Authorization", `Uid ${uid}`)
        .send({
          uid: new ObjectId().toHexString(),
          reason: "Suspected cheating",
          comment: "comment",
          captcha: "captcha",
        })
        .expect(503);

      //THEN
      expect(body.message).toEqual("User reporting is unavailable.");
    });
  });
  describe("set streak hour offset", () => {
    const getPartialUserMock = vi.spyOn(UserDal, "getPartialUser");
    const setStreakHourOffsetMock = vi.spyOn(UserDal, "setStreakHourOffset");
    const addImportantLogMock = vi.spyOn(LogDal, "addImportantLog");

    beforeEach(() => {
      getPartialUserMock.mockReset().mockResolvedValue({} as any);
      setStreakHourOffsetMock.mockReset();
      addImportantLogMock.mockReset();
    });

    it("should set", async () => {
      //WHEN
      const { body } = await mockApp
        .post("/users/setStreakHourOffset")
        .set("Authorization", `Uid ${uid}`)
        .send({ hourOffset: -2 })
        .expect(200);

      //THEN
      expect(body).toEqual({
        message: "Streak hour offset set",
        data: null,
      });

      expect(setStreakHourOffsetMock).toHaveBeenCalledWith(uid, -2);
      expect(addImportantLogMock).toHaveBeenCalledWith(
        "user_streak_hour_offset_set",
        { hourOffset: -2 },
        uid
      );
    });
    it("should fail if offset already set", async () => {
      //GIVEN
      getPartialUserMock.mockResolvedValue({
        streak: { hourOffset: -2 },
      } as any);

      //WHEN
      const { body } = await mockApp
        .post("/users/setStreakHourOffset")
        .set("Authorization", `Uid ${uid}`)
        .send({ hourOffset: -2 })
        .expect(403);

      //THEN
      expect(body.message).toEqual("Streak hour offset already set");
      expect(setStreakHourOffsetMock).not.toHaveBeenCalled();
      expect(addImportantLogMock).not.toHaveBeenCalled();
    });
    it("should fail without mandatory properties", async () => {
      //WHEN
      const { body } = await mockApp
        .post("/users/setStreakHourOffset")
        .set("Authorization", `Uid ${uid}`)
        .expect(422);

      //THEN
      expect(body).toEqual({
        message: "Invalid request data schema",
        validationErrors: ['"hourOffset" Required'],
      });
    });
    it("should fail with invalid offset", async () => {
      await mockApp
        .post("/users/setStreakHourOffset")
        .set("Authorization", `Uid ${uid}`)
        .send({ hourOffset: -12 })
        .expect(422);

      await mockApp
        .post("/users/setStreakHourOffset")
        .set("Authorization", `Uid ${uid}`)
        .send({ hourOffset: 13 })
        .expect(422);

      await mockApp
        .post("/users/setStreakHourOffset")
        .set("Authorization", `Uid ${uid}`)
        .send({ hourOffset: "UTC-8" })
        .expect(422);
    });
  });
  describe("revoke all token", () => {
    const removeTokensByUidMock = vi.spyOn(AuthUtils, "revokeTokensByUid");
    const addImportantLogMock = vi.spyOn(LogDal, "addImportantLog");

    beforeEach(() => {
      removeTokensByUidMock.mockReset();
      addImportantLogMock.mockReset();
    });
    it("should revoke all tokens", async () => {
      //WHEN
      const { body } = await mockApp
        .post("/users/revokeAllTokens")
        .set("Authorization", `Uid ${uid}`)
        .expect(200);

      //THEN
      expect(body).toEqual({
        message: "All tokens revoked",
        data: null,
      });
      expect(removeTokensByUidMock).toHaveBeenCalledWith(uid);
      expect(addImportantLogMock).toHaveBeenCalledWith(
        "user_tokens_revoked",
        "",
        uid
      );
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
      } as Partial<UserDal.DBUser> as UserDal.DBUser;
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
      } as Partial<UserDal.DBUser> as UserDal.DBUser;
      getUserMock.mockResolvedValue(user);

      //WHEN
      const result = await mockApp
        .get("/users/streak")
        .set("Authorization", "Bearer 123456789")
        .send()
        .expect(200);

      //THEN
      const streak: UserStreak = result.body.data;
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

async function enableResultFilterPresets(enabled: boolean): Promise<void> {
  const mockConfig = _.merge(await configuration, {
    results: { filterPresets: { enabled } },
  });

  vi.spyOn(Configuration, "getCachedConfiguration").mockResolvedValue(
    mockConfig
  );
}

async function acceptApeKeys(enabled: boolean): Promise<void> {
  const mockConfig = _.merge(await configuration, {
    apeKeys: { acceptKeys: enabled },
  });

  vi.spyOn(Configuration, "getCachedConfiguration").mockResolvedValue(
    mockConfig
  );
}

async function enableProfiles(enabled: boolean): Promise<void> {
  const mockConfig = _.merge(await configuration, {
    users: { profiles: { enabled } },
  });

  vi.spyOn(Configuration, "getCachedConfiguration").mockResolvedValue(
    mockConfig
  );
}
async function enableInbox(enabled: boolean): Promise<void> {
  const mockConfig = _.merge(await configuration, {
    users: { inbox: { enabled } },
  });

  vi.spyOn(Configuration, "getCachedConfiguration").mockResolvedValue(
    mockConfig
  );
}

async function enableReporting(enabled: boolean): Promise<void> {
  const mockConfig = _.merge(await configuration, {
    quotes: { reporting: { enabled } },
  });

  vi.spyOn(Configuration, "getCachedConfiguration").mockResolvedValue(
    mockConfig
  );
}
