import request from "supertest";
import app from "../../../src/app";
import _ from "lodash";
import * as Configuration from "../../../src/init/configuration";
import * as UserDal from "../../../src/dal/user";
import * as AuthUtils from "../../../src/utils/auth";
import { DecodedIdToken } from "firebase-admin/lib/auth/token-verifier";
import MonkeyError from "../../../src/utils/error";

const mockApp = request(app);
const configuration = Configuration.getCachedConfiguration();

const uid = "123456";

const mockDecodedToken: DecodedIdToken = {
  uid,
  email: "newuser@mail.com",
  iat: 0,
} as DecodedIdToken;

jest.spyOn(AuthUtils, "verifyIdToken").mockResolvedValue(mockDecodedToken);

function dummyUser(uid): MonkeyTypes.User {
  return {
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
}

const userGetMock = jest.spyOn(UserDal, "getUser");
const userGetFriendsListMock = jest.spyOn(UserDal, "getFriendsList");
const userAddFriendMock = jest.spyOn(UserDal, "addFriend");
const userRemoveFriendMock = jest.spyOn(UserDal, "removeFriend");

describe("UserController", () => {
  describe("user creation flow", () => {
    beforeEach(() => {
      enableSignUpFeatures(true);
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

  describe("friends", () => {
    beforeEach(async () => {
      await enablePremiumFeatures(true);
    });

    describe("getFriends", () => {
      afterEach(() => {
        [userGetMock, userGetFriendsListMock].forEach((it) => it.mockReset());
      });

      it("should get get friends list", async () => {
        //GIVEN
        userGetFriendsListMock.mockResolvedValue([]);

        //WHEN
        const {
          body: { data: friendsList },
        } = await mockApp
          .get("/users/friends")
          .set("Authorization", "Bearer 123456789")
          .send()
          .expect(200);

        //THEN
        expect(friendsList).toEqual([]);

        expect(userGetFriendsListMock).toBeCalledWith(uid);
      });

      describe("validations", () => {
        it("should fail if premium feature is disabled", async () => {
          //GIVEN
          await enablePremiumFeatures(false);

          //WHEN
          await mockApp
            .get("/users/friends")
            .set("Authorization", "Bearer 123456789")
            .send()
            .expect(503)
            .expect(expectErrorMessage("Premium is temporarily disabled."));
        });

        it("should fail without authorization", async () => {
          await mockApp.get("/users/friends").send().expect(401);
        });
      });
    });
    describe("addFriend", () => {
      afterEach(() => {
        [userGetMock, userAddFriendMock].forEach((it) => it.mockReset());
      });
      it("should add friend if exist", async () => {
        //GIVEN
        userGetMock.mockResolvedValue(dummyUser("any"));

        //WHEN
        await mockApp
          .post("/users/friends")
          .set("Authorization", "Bearer 123456789")
          .send({ uid: "123" })
          .expect(200);

        //THEN
        expect(userGetMock).toHaveBeenCalledWith("123", "addFriend");
        expect(userGetMock).toHaveBeenCalledWith(uid, "addFriend");
        expect(userAddFriendMock).toHaveBeenCalledWith(uid, "123");
      });

      it("should fail adding a friend that does not exists", async () => {
        //GIVEN
        userGetMock.mockImplementation(async (uid, stack) => {
          if (uid === "unknown") throw new MonkeyError(404);
          return dummyUser(uid);
        });

        //WHEN
        await mockApp
          .post("/users/friends")
          .set("Authorization", "Bearer 123456789")
          .send({ uid: "unknown" })
          .expect(404);

        //THEN
        expect(userAddFriendMock).not.toHaveBeenCalled();
      });

      it("should fail exceeding max friends limit", async () => {
        //GIVEN
        const user = dummyUser(uid);
        user.friends = [...Array(32).keys()].map((it) => "uid" + it);
        userGetMock.mockResolvedValue(user);

        //WHEN
        await mockApp
          .post("/users/friends")
          .set("Authorization", "Bearer 123456789")
          .send({ uid: "123" })
          .expect(400)
          .expect(expectErrorMessage("You can only have up to 25 friends"));

        //THEN
        expect(userAddFriendMock).not.toHaveBeenCalled();
      });

      describe("validations", () => {
        it("should fail without body", async () => {
          //WHEN
          await mockApp
            .post("/users/friends")
            .set("Authorization", "Bearer 123456789")
            .send()
            .expect(422)
            .expect(expectErrorMessage('"uid" is required (undefined)'));
        });

        it("should fail if premium feature is disabled", async () => {
          //GIVEN
          await enablePremiumFeatures(false);

          //WHEN
          await mockApp
            .post("/users/friends")
            .set("Authorization", "Bearer 123456789")
            .send()
            .expect(503)
            .expect(expectErrorMessage("Premium is temporarily disabled."));
        });

        it("should fail without authorization", async () => {
          await mockApp.post("/users/friends").send().expect(401);
        });
      });
    });

    describe("removeFriend", () => {
      afterEach(() => {
        [userGetMock, userRemoveFriendMock].forEach((it) => it.mockReset());
      });
      it("should remove friend if exist", async () => {
        //WHEN
        await mockApp
          .delete("/users/friends/123")
          .set("Authorization", "Bearer 123456789")
          .send()
          .expect(200);

        //THEN
        expect(userRemoveFriendMock).toHaveBeenCalledWith(uid, "123");
      });
      describe("validations", () => {
        it("should fail if premium feature is disabled", async () => {
          //GIVEN
          await enablePremiumFeatures(false);

          //WHEN
          await mockApp
            .delete("/users/friends/123")
            .set("Authorization", "Bearer 123456789")
            .send()
            .expect(503)
            .expect(expectErrorMessage("Premium is temporarily disabled."));
        });

        it("should fail without authorization", async () => {
          await mockApp.delete("/users/friends/123").send().expect(401);
        });
      });
    });
  });
});

async function enablePremiumFeatures(premium: boolean): Promise<void> {
  const mockConfig = _.merge(await configuration, {
    users: { premium: { enabled: premium }, signup: true },
  });

  jest
    .spyOn(Configuration, "getCachedConfiguration")
    .mockResolvedValue(mockConfig);
}

async function enableSignUpFeatures(enabled: boolean): Promise<void> {
  const mockConfig = _.merge(await configuration, {
    users: { signUp: enabled },
  });

  jest
    .spyOn(Configuration, "getCachedConfiguration")
    .mockResolvedValue(mockConfig);
}

function expectErrorMessage(message: string): (res: request.Response) => void {
  return (res) => expect(res.body).toHaveProperty("message", message);
}
