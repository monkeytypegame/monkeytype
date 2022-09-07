import _ from "lodash";
import { ObjectId } from "mongodb";
import { updateStreak } from "../../src/dal/user";
import * as UserDAL from "../../src/dal/user";

const mockPersonalBest = {
  acc: 1,
  consistency: 1,
  difficulty: "normal" as const,
  lazyMode: true,
  language: "no",
  punctuation: false,
  raw: 230,
  wpm: 215,
  timestamp: 13123123,
};

const mockResultFilter = {
  _id: new ObjectId(),
  name: "sfdkjhgdf",
  difficulty: {
    normal: true,
    expert: false,
    master: false,
  },
  mode: {
    words: false,
    time: true,
    quote: false,
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
    "30": true,
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
    none: true,
  },
  language: {
    english: true,
  },
  funbox: {
    none: true,
  },
};

describe("UserDal", () => {
  it("should be able to insert users", async () => {
    // given
    const newUser = {
      name: "Test",
      email: "mockemail@email.com",
      uid: "userId",
    };

    // when
    await UserDAL.addUser(newUser.name, newUser.email, newUser.uid);
    const insertedUser = await UserDAL.getUser("userId", "test");

    // then
    expect(insertedUser.email).toBe(newUser.email);
    expect(insertedUser.uid).toBe(newUser.uid);
    expect(insertedUser.name).toBe(newUser.name);
  });

  it("should error if the user already exists", async () => {
    // given
    const newUser = {
      name: "Test",
      email: "mockemail@email.com",
      uid: "userId",
    };

    // when
    await UserDAL.addUser(newUser.name, newUser.email, newUser.uid);

    // then
    // should error because user already exists
    await expect(
      UserDAL.addUser(newUser.name, newUser.email, newUser.uid)
    ).rejects.toThrow("User document already exists");
  });

  it("updatename should not allow unavailable usernames", async () => {
    // given
    const mockUsers = [...Array(3).keys()]
      .map((id) => ({
        name: `Test${id}`,
        email: `mockemail@email.com${id}`,
        uid: `userId${id}`,
      }))
      .map(({ name, email, uid }) => UserDAL.addUser(name, email, uid));
    await Promise.all(mockUsers);

    const userToUpdateNameFor = await UserDAL.getUser("userId0", "test");
    const userWithNameTaken = await UserDAL.getUser("userId1", "test");

    // when, then
    await expect(
      UserDAL.updateName(userToUpdateNameFor.uid, userWithNameTaken.name)
    ).rejects.toThrow("Username already taken");
  });

  it("updatename should not allow invalid usernames", async () => {
    // given
    const testUser = {
      name: "Test",
      email: "mockemail@email.com",
      uid: "userId",
    };

    await UserDAL.addUser(testUser.name, testUser.email, testUser.uid);

    const invalidNames = [
      null, // falsy
      undefined, // falsy
      "", // empty
      " ".repeat(16), // too long
      ".testName", // cant begin with period
      "miodec", // profanity
      "asdasdAS$", // invalid characters
    ];

    // when, then
    invalidNames.forEach(
      async (invalidName) =>
        await expect(
          UserDAL.updateName(testUser.uid, invalidName as unknown as string)
        ).rejects.toThrow("Invalid username")
    );
  });

  it("UserDAL.updateName should fail if user has changed name recently", async () => {
    // given
    const testUser = {
      name: "Test",
      email: "mockemail@email.com",
      uid: "userId",
    };

    await UserDAL.addUser(testUser.name, testUser.email, testUser.uid);

    // when
    await UserDAL.updateName(testUser.uid, "renamedTestUser");

    const updatedUser = await UserDAL.getUser(testUser.uid, "test");

    // then
    expect(updatedUser.name).toBe("renamedTestUser");

    await expect(
      UserDAL.updateName(updatedUser.uid, "NewValidName")
    ).rejects.toThrow("You can change your name once every 30 days");
  });

  it("UserDAL.updateName should change the name of a user", async () => {
    // given
    const testUser = {
      name: "Test",
      email: "mockemail@email.com",
      uid: "userId",
    };

    await UserDAL.addUser(testUser.name, testUser.email, testUser.uid);

    // when
    await UserDAL.updateName(testUser.uid, "renamedTestUser");

    // then
    const updatedUser = await UserDAL.getUser(testUser.uid, "test");
    expect(updatedUser.name).toBe("renamedTestUser");
  });

  it("clearPb should clear the personalBests of a user", async () => {
    // given
    const testUser = {
      name: "Test",
      email: "mockemail@email.com",
      uid: "userId",
    };
    await UserDAL.addUser(testUser.name, testUser.email, testUser.uid);
    await UserDAL.getUsersCollection().updateOne(
      { uid: testUser.uid },
      {
        $set: {
          personalBests: {
            time: { 20: [mockPersonalBest] },
            words: {},
            quote: {},
            custom: {},
            zen: {},
          },
        },
      }
    );

    const { personalBests } =
      (await UserDAL.getUser(testUser.uid, "test")) ?? {};
    expect(personalBests).toStrictEqual({
      time: { 20: [mockPersonalBest] },
      words: {},
      quote: {},
      custom: {},
      zen: {},
    });
    // when
    await UserDAL.clearPb(testUser.uid);

    // then
    const updatedUser = (await UserDAL.getUser(testUser.uid, "test")) ?? {};
    expect(_.values(updatedUser.personalBests).filter(_.isEmpty)).toHaveLength(
      5
    );
  });

  it("autoBan should automatically ban after configured anticheat triggers", async () => {
    // given
    const testUser = {
      name: "Test",
      email: "mockemail@email.com",
      uid: "userId",
    };

    await UserDAL.addUser(testUser.name, testUser.email, testUser.uid);

    // when
    Date.now = jest.fn(() => 0);
    await UserDAL.recordAutoBanEvent(testUser.uid, 2, 1);
    await UserDAL.recordAutoBanEvent(testUser.uid, 2, 1);
    await UserDAL.recordAutoBanEvent(testUser.uid, 2, 1);

    // then
    const updatedUser = await UserDAL.getUser(testUser.uid, "test");
    expect(updatedUser.banned).toBe(true);
    expect(updatedUser.autoBanTimestamps).toEqual([0, 0, 0]);
  });

  it("autoBan should not ban ban if triggered once", async () => {
    // given
    const testUser = {
      name: "Test",
      email: "mockemail@email.com",
      uid: "userId",
    };

    await UserDAL.addUser(testUser.name, testUser.email, testUser.uid);

    // when
    Date.now = jest.fn(() => 0);
    await UserDAL.recordAutoBanEvent(testUser.uid, 2, 1);

    // then
    const updatedUser = await UserDAL.getUser(testUser.uid, "test");
    expect(updatedUser.banned).toBe(undefined);
    expect(updatedUser.autoBanTimestamps).toEqual([0]);
  });

  it("autoBan should correctly remove old anticheat triggers", async () => {
    // given
    const testUser = {
      name: "Test",
      email: "mockemail@email.com",
      uid: "userId",
    };

    await UserDAL.addUser(testUser.name, testUser.email, testUser.uid);

    // when
    Date.now = jest.fn(() => 0);
    await UserDAL.recordAutoBanEvent(testUser.uid, 2, 1);
    await UserDAL.recordAutoBanEvent(testUser.uid, 2, 1);

    Date.now = jest.fn(() => 36000000);

    await UserDAL.recordAutoBanEvent(testUser.uid, 2, 1);

    // then
    const updatedUser = await UserDAL.getUser(testUser.uid, "test");
    expect(updatedUser.banned).toBe(undefined);
    expect(updatedUser.autoBanTimestamps).toEqual([36000000]);
  });

  it("addResultFilterPreset should return error if uuid not found", async () => {
    // given
    await UserDAL.addUser("test name", "test email", "TestID");

    // when, then
    await expect(
      UserDAL.addResultFilterPreset("non existing uid", mockResultFilter, 5)
    ).rejects.toThrow("User not found");
  });

  it("UserDAL.addResultFilterPreset should return error if user has reached maximum", async () => {
    // given
    await UserDAL.addUser("test name", "test email", "TestID");
    await UserDAL.addResultFilterPreset("TestID", mockResultFilter, 1);

    // when, then
    await expect(
      UserDAL.addResultFilterPreset("TestID", mockResultFilter, 1)
    ).rejects.toThrow("Maximum number of custom filters reached for user.");
  });

  it("addResultFilterPreset success", async () => {
    // given
    await UserDAL.addUser("test name", "test email", "TestID");

    // when
    const result = await UserDAL.addResultFilterPreset(
      "TestID",
      mockResultFilter,
      1
    );

    // then
    const user = await UserDAL.getUser("TestID", "test add result filters");
    const createdFilter = user.resultFilterPresets ?? [];

    expect(result).toStrictEqual(createdFilter[0]._id);
  });

  it("updateProfile should appropriately handle multiple profile updates", async () => {
    await UserDAL.addUser("test name", "test email", "TestID");

    await UserDAL.updateProfile(
      "TestID",
      {
        bio: "test bio",
      },
      {
        badges: [],
      }
    );

    const user = await UserDAL.getUser("TestID", "test add result filters");
    expect(user.profileDetails).toStrictEqual({
      bio: "test bio",
    });
    expect(user.inventory).toStrictEqual({
      badges: [],
    });

    await UserDAL.updateProfile(
      "TestID",
      {
        keyboard: "test keyboard",
        socialProfiles: {
          twitter: "test twitter",
        },
      },
      {
        badges: [
          {
            id: 1,
            selected: true,
          },
        ],
      }
    );

    const updatedUser = await UserDAL.getUser(
      "TestID",
      "test add result filters"
    );
    expect(updatedUser.profileDetails).toStrictEqual({
      bio: "test bio",
      keyboard: "test keyboard",
      socialProfiles: {
        twitter: "test twitter",
      },
    });
    expect(updatedUser.inventory).toStrictEqual({
      badges: [
        {
          id: 1,
          selected: true,
        },
      ],
    });

    await UserDAL.updateProfile(
      "TestID",
      {
        bio: "test bio 2",
        socialProfiles: {
          github: "test github",
          website: "test website",
        },
      },
      {
        badges: [
          {
            id: 1,
          },
        ],
      }
    );

    const updatedUser2 = await UserDAL.getUser(
      "TestID",
      "test add result filters"
    );
    expect(updatedUser2.profileDetails).toStrictEqual({
      bio: "test bio 2",
      keyboard: "test keyboard",
      socialProfiles: {
        twitter: "test twitter",
        github: "test github",
        website: "test website",
      },
    });
    expect(updatedUser2.inventory).toStrictEqual({
      badges: [
        {
          id: 1,
        },
      ],
    });
  });

  it("resetUser should reset user", async () => {
    await UserDAL.addUser("test name", "test email", "TestID");

    await UserDAL.updateProfile(
      "TestID",
      {
        bio: "test bio",
        keyboard: "test keyboard",
        socialProfiles: {
          twitter: "test twitter",
          github: "test github",
        },
      },
      {
        badges: [],
      }
    );

    await UserDAL.incrementBananas("TestID", "100");
    await UserDAL.incrementXp("TestID", 15);

    await UserDAL.resetUser("TestID");
    const resetUser = await UserDAL.getUser(
      "TestID",
      "test add result filters"
    );

    expect(resetUser.profileDetails).toStrictEqual({
      bio: "",
      keyboard: "",
      socialProfiles: {},
    });

    expect(resetUser.inventory).toStrictEqual({
      badges: [],
    });

    expect(resetUser.bananas).toStrictEqual(0);
    expect(resetUser.xp).toStrictEqual(0);
    expect(resetUser.streak).toStrictEqual({
      length: 0,
      lastResultTimestamp: 0,
      maxLength: 0,
    });
  });

  it("getInbox should return the user's inbox", async () => {
    await UserDAL.addUser("test name", "test email", "TestID");

    const emptyInbox = await UserDAL.getInbox("TestID");

    expect(emptyInbox).toStrictEqual([]);

    await UserDAL.addToInbox(
      "TestID",
      [
        {
          subject: `Hello!`,
        } as any,
      ],
      {
        enabled: true,
        maxMail: 100,
      }
    );

    const inbox = await UserDAL.getInbox("TestID");

    expect(inbox).toStrictEqual([
      {
        subject: "Hello!",
      },
    ]);
  });

  it("addToInbox discards mail if inbox is full", async () => {
    await UserDAL.addUser("test name", "test email", "TestID");

    const config = {
      enabled: true,
      maxMail: 1,
    };

    await UserDAL.addToInbox(
      "TestID",
      [
        {
          subject: "Hello 1!",
        } as any,
      ],
      config
    );

    await UserDAL.addToInbox(
      "TestID",
      [
        {
          subject: "Hello 2!",
        } as any,
      ],
      config
    );

    const inbox = await UserDAL.getInbox("TestID");

    expect(inbox).toStrictEqual([
      {
        subject: "Hello 2!",
      },
    ]);
  });

  it("addToInboxBulk should add mail to multiple users", async () => {
    await UserDAL.addUser("test name", "test email", "TestID");
    await UserDAL.addUser("test name 2", "test email 2", "TestID2");

    await UserDAL.addToInboxBulk(
      [
        {
          uid: "TestID",
          mail: [
            {
              subject: `Hello!`,
            } as any,
          ],
        },
        {
          uid: "TestID2",
          mail: [
            {
              subject: `Hello 2!`,
            } as any,
          ],
        },
      ],
      {
        enabled: true,
        maxMail: 100,
      }
    );

    const inbox = await UserDAL.getInbox("TestID");
    const inbox2 = await UserDAL.getInbox("TestID2");

    expect(inbox).toStrictEqual([
      {
        subject: "Hello!",
      },
    ]);

    expect(inbox2).toStrictEqual([
      {
        subject: "Hello 2!",
      },
    ]);
  });

  it("updateStreak should update streak", async () => {
    await UserDAL.addUser("testStack", "test email", "TestID");

    Date.now = jest.fn(() => 1662372000000);

    const streak1 = await updateStreak("TestID", 1662372000000);

    await expect(streak1).toBe(1);

    Date.now = jest.fn(() => 1662458400000);

    const streak2 = await updateStreak("TestID", 1662458400000);

    await expect(streak2).toBe(2);

    Date.now = jest.fn(() => 1999969721000000);

    const streak3 = await updateStreak("TestID", 1999969721000);

    await expect(streak3).toBe(1);
  });
});
