import _ from "lodash";
import { updateStreak } from "../../src/dal/user";
import * as UserDAL from "../../src/dal/user";
import * as UserTestData from "../__testData__/users";

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

const mockResultFilter: SharedTypes.ResultFilters = {
  _id: "id",
  name: "sfdkjhgdf",
  pb: {
    no: true,
    yes: true,
  },
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

  it("isNameAvailable should correctly check if a username is available", async () => {
    // given
    await UserDAL.addUser("user1", "user1@email.com", "userId1");
    await UserDAL.addUser("user2", "user2@email.com", "userId2");

    const testCases = [
      {
        name: "user1",
        whosChecking: "userId1",
        expected: true,
      },
      {
        name: "USER1",
        whosChecking: "userId1",
        expected: true,
      },
      {
        name: "user2",
        whosChecking: "userId1",
        expected: false,
      },
    ];

    // when, then
    for (const { name, expected, whosChecking } of testCases) {
      const isAvailable = await UserDAL.isNameAvailable(name, whosChecking);
      expect(isAvailable).toBe(expected);
    }
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
      UserDAL.updateName(
        userToUpdateNameFor.uid,
        userWithNameTaken.name,
        userToUpdateNameFor.name
      )
    ).rejects.toThrow("Username already taken");
  });

  it("same usernames (different casing) should be available only for the same user", async () => {
    await UserDAL.addUser("User1", "user1@test.com", "uid1");

    await UserDAL.addUser("User2", "user2@test.com", "uid2");

    const user1 = await UserDAL.getUser("uid1", "test");
    const user2 = await UserDAL.getUser("uid2", "test");

    await UserDAL.updateName(user1.uid, "user1", user1.name);

    const updatedUser1 = await UserDAL.getUser("uid1", "test");

    // when, then
    expect(updatedUser1.name).toBe("user1");

    await expect(
      UserDAL.updateName(user2.uid, "USER1", user2.name)
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
      "asdasdAS$", // invalid characters
    ];

    // when, then
    invalidNames.forEach(
      async (invalidName) =>
        await expect(
          UserDAL.updateName(
            testUser.uid,
            invalidName as unknown as string,
            testUser.name
          )
        ).rejects.toThrow("Invalid username")
    );
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
    await UserDAL.updateName(testUser.uid, "renamedTestUser", testUser.name);

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
            zen: {},
            custom: {},
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
    Date.now = vi.fn(() => 0);
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
    Date.now = vi.fn(() => 0);
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
    Date.now = vi.fn(() => 0);
    await UserDAL.recordAutoBanEvent(testUser.uid, 2, 1);
    await UserDAL.recordAutoBanEvent(testUser.uid, 2, 1);

    Date.now = vi.fn(() => 36000000);

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

    expect(result).toStrictEqual(createdFilter[0]?._id);
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

    const testSteps = [
      {
        date: "2023/06/07 21:00:00 UTC",
        expectedStreak: 1,
      },
      {
        date: "2023/06/07 23:00:00 UTC",
        expectedStreak: 1,
      },
      {
        date: "2023/06/08 00:00:00 UTC",
        expectedStreak: 2,
      },
      {
        date: "2023/06/08 23:00:00 UTC",
        expectedStreak: 2,
      },
      {
        date: "2023/06/09 00:00:00 UTC",
        expectedStreak: 3,
      },
      {
        date: "2023/06/11 00:00:00 UTC",
        expectedStreak: 1,
      },
    ];

    for (const { date, expectedStreak } of testSteps) {
      const milis = new Date(date).getTime();
      Date.now = vi.fn(() => milis);

      const streak = await updateStreak("TestID", milis);

      await expect(streak).toBe(expectedStreak);
    }
  });

  it("positive streak offset should award streak correctly", async () => {
    await UserDAL.addUser("testStack", "test email", "TestID");

    await UserDAL.setStreakHourOffset("TestID", 10);

    const testSteps = [
      {
        date: "2023/06/06 21:00:00 UTC",
        expectedStreak: 1,
      },
      {
        date: "2023/06/07 01:00:00 UTC",
        expectedStreak: 1,
      },
      {
        date: "2023/06/07 09:00:00 UTC",
        expectedStreak: 1,
      },
      {
        date: "2023/06/07 10:00:00 UTC",
        expectedStreak: 2,
      },
      {
        date: "2023/06/07 23:00:00 UTC",
        expectedStreak: 2,
      },
      {
        date: "2023/06/08 00:00:00 UTC",
        expectedStreak: 2,
      },
      {
        date: "2023/06/08 01:00:00 UTC",
        expectedStreak: 2,
      },
      {
        date: "2023/06/08 09:00:00 UTC",
        expectedStreak: 2,
      },
      {
        date: "2023/06/08 10:00:00 UTC",
        expectedStreak: 3,
      },
      {
        date: "2023/06/10 10:00:00 UTC",
        expectedStreak: 1,
      },
    ];

    for (const { date, expectedStreak } of testSteps) {
      const milis = new Date(date).getTime();
      Date.now = vi.fn(() => milis);

      const streak = await updateStreak("TestID", milis);

      await expect(streak).toBe(expectedStreak);
    }
  });

  it("negative streak offset should award streak correctly", async () => {
    await UserDAL.addUser("testStack", "test email", "TestID");

    await UserDAL.setStreakHourOffset("TestID", -4);

    const testSteps = [
      {
        date: "2023/06/06 19:00:00 UTC",
        expectedStreak: 1,
      },
      {
        date: "2023/06/06 20:00:00 UTC",
        expectedStreak: 2,
      },
      {
        date: "2023/06/07 01:00:00 UTC",
        expectedStreak: 2,
      },
      {
        date: "2023/06/07 19:00:00 UTC",
        expectedStreak: 2,
      },
      {
        date: "2023/06/07 20:00:00 UTC",
        expectedStreak: 3,
      },
      {
        date: "2023/06/09 23:00:00 UTC",
        expectedStreak: 1,
      },
    ];

    for (const { date, expectedStreak } of testSteps) {
      const milis = new Date(date).getTime();
      Date.now = vi.fn(() => milis);

      const streak = await updateStreak("TestID", milis);

      await expect(streak).toBe(expectedStreak);
    }
  });
  describe("incrementTestActivity", () => {
    it("ignores user without migration", async () => {
      // given
      const user = await UserTestData.createUserWithoutMigration();

      //when
      await UserDAL.incrementTestActivity(user, 1712102400000);

      //then
      const read = await UserDAL.getUser(user.uid, "");
      expect(read.testActivity).toBeUndefined();
    });
    it("increments for new year", async () => {
      // given
      const user = await UserTestData.createUser({
        testActivity: { "2023": [null, 1] },
      });

      //when
      await UserDAL.incrementTestActivity(user, 1712102400000);

      //then
      const read = (await UserDAL.getUser(user.uid, "")).testActivity || {};
      expect(read).toHaveProperty("2024");
      const year2024 = read["2024"];
      expect(year2024).toHaveLength(94);
      //fill previous days with null
      expect(year2024.slice(0, 93)).toEqual(new Array(93).fill(null));
      expect(year2024[93]).toEqual(1);
    });
    it("increments for existing year", async () => {
      // given
      const user = await UserTestData.createUser({
        testActivity: { "2024": [null, 5] },
      });

      //when
      await UserDAL.incrementTestActivity(user, 1712102400000);

      //then
      const read = (await UserDAL.getUser(user.uid, "")).testActivity || {};
      expect(read).toHaveProperty("2024");
      const year2024 = read["2024"];
      expect(year2024).toHaveLength(94);

      expect(year2024[0]).toBeNull();
      expect(year2024[1]).toEqual(5);
      expect(year2024.slice(2, 91)).toEqual(new Array(89).fill(null));
      expect(year2024[93]).toEqual(1);
    });
    it("increments for existing day", async () => {
      // given
      let user = await UserTestData.createUser({ testActivity: {} });
      await UserDAL.incrementTestActivity(user, 1712102400000);
      user = await UserDAL.getUser(user.uid, "");

      //when
      await UserDAL.incrementTestActivity(user, 1712102400000);

      //then
      const read = (await UserDAL.getUser(user.uid, "")).testActivity || {};
      const year2024 = read["2024"];
      expect(year2024[93]).toEqual(2);
    });
  });
  describe("getPartialUser", () => {
    it("should throw for unknown user", async () => {
      expect(async () =>
        UserDAL.getPartialUser("1234", "stack", [])
      ).rejects.toThrowError("User not found\nStack: stack");
    });

    it("should get streak", async () => {
      //GIVEN
      let user = await UserTestData.createUser({
        streak: {
          hourOffset: 1,
          length: 5,
          lastResultTimestamp: 4711,
          maxLength: 23,
        },
      });

      //WHEN
      const partial = await UserDAL.getPartialUser(user.uid, "streak", [
        "streak",
      ]);

      //THEN
      expect(partial).toStrictEqual({
        _id: user._id,
        streak: {
          hourOffset: 1,
          length: 5,
          lastResultTimestamp: 4711,
          maxLength: 23,
        },
      });
    });
  });
  describe("updateEmail", () => {
    it("throws for nonexisting user", async () => {
      expect(async () =>
        UserDAL.updateEmail(123, "test@example.com")
      ).rejects.toThrowError("User not found\nStack: update email");
    });
  });
  describe("updateInbox", () => {
    it("claims rewards on read", async () => {
      //GIVEN
      const rewardOne: SharedTypes.MonkeyMail = {
        id: "b5866d4c-0749-41b6-b101-3656249d39b9",
        body: "test",
        subject: "reward one",
        timestamp: 1,
        read: false,
        rewards: [
          { type: "xp", item: 400 },
          { type: "xp", item: 600 },
          { type: "badge", item: { id: 4 } },
        ],
      };
      const rewardTwo: SharedTypes.MonkeyMail = {
        id: "3692b9f5-84fb-4d9b-bd39-9a3217b3a33a",
        body: "test",
        subject: "reward two",
        timestamp: 2,
        read: false,
        rewards: [{ type: "xp", item: 2000 }],
      };
      const rewardThree: SharedTypes.MonkeyMail = {
        id: "0d73b3e0-dc79-4abb-bcaf-66fa6b09a58a",
        body: "test",
        subject: "reward three",
        timestamp: 3,
        read: true,
        rewards: [{ type: "xp", item: 3000 }],
      };
      const rewardFour: SharedTypes.MonkeyMail = {
        id: "d852d2cf-1802-4cd0-9fb4-336650fc470a",
        body: "test",
        subject: "reward four",
        timestamp: 4,
        read: false,
        rewards: [{ type: "xp", item: 4000 }],
      };

      let user = await UserTestData.createUser({
        xp: 100,
        inbox: [rewardOne, rewardTwo, rewardThree, rewardFour],
      });

      //WNEN

      await UserDAL.updateInbox(
        user.uid,
        [rewardOne.id, rewardTwo.id, rewardThree.id],
        []
      );

      //THEN
      const read = await UserDAL.getUser(user.uid, "");
      expect(read).not.toHaveProperty("tmp");

      const { xp, inbox } = read;
      expect(xp).toEqual(3100); //100 existing + 1000 from rewardOne, 2000 from rewardTwo

      //inbox is sorted by timestamp
      expect(inbox).toStrictEqual([
        { ...rewardFour },
        { ...rewardThree },
        { ...rewardTwo, read: true, rewards: [] },
        { ...rewardOne, read: true, rewards: [] },
      ]);
    });

    it("claims rewards on delete", async () => {
      //GIVEN
      //GIVEN
      const rewardOne: SharedTypes.MonkeyMail = {
        id: "b5866d4c-0749-41b6-b101-3656249d39b9",
        body: "test",
        subject: "reward one",
        timestamp: 1,
        read: false,
        rewards: [
          { type: "xp", item: 400 },
          { type: "xp", item: 600 },
          { type: "badge", item: { id: 4 } },
        ],
      };
      const rewardTwo: SharedTypes.MonkeyMail = {
        id: "3692b9f5-84fb-4d9b-bd39-9a3217b3a33a",
        body: "test",
        subject: "reward two",
        timestamp: 2,
        read: true,
        rewards: [{ type: "xp", item: 2000 }],
      };

      const rewardThree: SharedTypes.MonkeyMail = {
        id: "0d73b3e0-dc79-4abb-bcaf-66fa6b09a58a",
        body: "test",
        subject: "reward three",
        timestamp: 4,
        read: false,
        rewards: [{ type: "xp", item: 3000 }],
      };

      let user = await UserTestData.createUser({
        xp: 100,
        inbox: [rewardOne, rewardTwo, rewardThree],
      });

      //WNEN
      await UserDAL.updateInbox(user.uid, [], [rewardOne.id, rewardTwo.id]);

      //THEN
      const { xp, inbox } = await UserDAL.getUser(user.uid, "");
      expect(xp).toBe(1100);
      expect(inbox).toStrictEqual([rewardThree]);
    });

    it("updates badge", async () => {
      //GIVEN
      const rewardOne: SharedTypes.MonkeyMail = {
        id: "b5866d4c-0749-41b6-b101-3656249d39b9",
        body: "test",
        subject: "reward one",
        timestamp: 2,
        read: false,
        rewards: [
          { type: "xp", item: 400 },
          { type: "badge", item: { id: 4 } },
        ],
      };
      const rewardTwo: SharedTypes.MonkeyMail = {
        id: "3692b9f5-84fb-4d9b-bd39-9a3217b3a33a",
        body: "test",
        subject: "reward two",
        timestamp: 1,
        read: false,
        rewards: [
          { type: "badge", item: { id: 3 } },
          { type: "badge", item: { id: 4 } },
          { type: "badge", item: { id: 5 } },
        ],
      };
      const rewardThree: SharedTypes.MonkeyMail = {
        id: "0d73b3e0-dc79-4abb-bcaf-66fa6b09a58a",
        body: "test",
        subject: "reward three",
        timestamp: 0,
        read: true,
        rewards: [{ type: "badge", item: { id: 6 } }],
      };

      let user = await UserTestData.createUser({
        inbox: [rewardOne, rewardTwo, rewardThree],
        inventory: {
          badges: [
            { id: 1, selected: true },
            { id: 3, selected: false },
          ],
        },
      });

      //WNEN
      await UserDAL.updateInbox(
        user.uid,
        [rewardOne.id, rewardTwo.id, rewardThree.id, rewardOne.id],
        []
      );

      //THEN
      const { inbox, inventory } = await UserDAL.getUser(user.uid, "");
      expect(inbox).toStrictEqual([
        { ...rewardOne, read: true, rewards: [] },
        { ...rewardTwo, read: true, rewards: [] },
        { ...rewardThree },
      ]);
      expect(inventory?.badges).toStrictEqual([
        { id: 1, selected: true }, //previously owned
        { id: 3, selected: false }, // previously owned, no duplicate
        { id: 4 }, // gets only added once
        { id: 5 },
      ]);
    });
    it("read and delete the same message does not claim reward twice", async () => {
      //GIVEN
      const rewardOne: SharedTypes.MonkeyMail = {
        id: "b5866d4c-0749-41b6-b101-3656249d39b9",
        body: "test",
        subject: "reward one",
        timestamp: 0,
        read: false,
        rewards: [{ type: "xp", item: 1000 }],
      };
      const rewardTwo: SharedTypes.MonkeyMail = {
        id: "3692b9f5-84fb-4d9b-bd39-9a3217b3a33a",
        body: "test",
        subject: "reward two",
        timestamp: 0,
        read: false,
        rewards: [{ type: "xp", item: 2000 }],
      };
      let user = await UserTestData.createUser({
        xp: 100,
        inbox: [rewardOne, rewardTwo],
      });

      await UserDAL.updateInbox(
        user.uid,
        [rewardOne.id, rewardTwo.id],
        [rewardOne.id, rewardTwo.id]
      );

      //THEN

      const { xp } = await UserDAL.getUser(user.uid, "");
      expect(xp).toEqual(3100);
    });

    it("concurrent calls dont claim a reward multiple times", async () => {
      //GIVEN
      const rewardOne: SharedTypes.MonkeyMail = {
        id: "b5866d4c-0749-41b6-b101-3656249d39b9",
        body: "test",
        subject: "reward one",
        timestamp: 0,
        read: false,
        rewards: [
          { type: "xp", item: 400 },
          { type: "xp", item: 600 },
          { type: "badge", item: { id: 4 } },
        ],
      };
      const rewardTwo: SharedTypes.MonkeyMail = {
        id: "3692b9f5-84fb-4d9b-bd39-9a3217b3a33a",
        body: "test",
        subject: "reward two",
        timestamp: 0,
        read: false,
        rewards: [{ type: "xp", item: 2000 }],
      };
      const rewardThree: SharedTypes.MonkeyMail = {
        id: "0d73b3e0-dc79-4abb-bcaf-66fa6b09a58a",
        body: "test",
        subject: "reward three",
        timestamp: 0,
        read: true,
        rewards: [{ type: "xp", item: 2000 }],
      };

      let user = await UserTestData.createUser({
        xp: 100,
        inbox: [rewardOne, rewardTwo, rewardThree],
      });

      const count = 100;
      const calls = new Array(count)
        .fill(0)
        .map(() =>
          UserDAL.updateInbox(
            user.uid,
            [rewardOne.id, rewardTwo.id, rewardThree.id],
            []
          )
        );

      await Promise.all(calls);

      //THEN

      const { xp } = await UserDAL.getUser(user.uid, "");
      expect(xp).toEqual(3100);
    });
  });
});
