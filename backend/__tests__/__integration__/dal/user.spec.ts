import { describe, it, expect, vi } from "vitest";

import * as UserDAL from "../../../src/dal/user";
import * as UserTestData from "../../__testData__/users";
import { createConnection as createFriend } from "../../__testData__/connections";
import { ObjectId } from "mongodb";
import { MonkeyMail, ResultFilters } from "@monkeytype/schemas/users";
import { PersonalBest, PersonalBests } from "@monkeytype/schemas/shared";
import { CustomThemeColors } from "@monkeytype/schemas/configs";

const mockPersonalBest: PersonalBest = {
  acc: 1,
  consistency: 1,
  difficulty: "normal" as const,
  lazyMode: true,
  language: "polish",
  punctuation: false,
  raw: 230,
  wpm: 215,
  timestamp: 13123123,
};

const mockResultFilter: ResultFilters = {
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

const mockDbResultFilter = { ...mockResultFilter, _id: new ObjectId() };

describe("UserDal", () => {
  it("should be able to insert users", async () => {
    // given
    const uid = new ObjectId().toHexString();
    const newUser = {
      name: "Test",
      email: "mockemail@email.com",
      uid,
    };

    // when
    await UserDAL.addUser(newUser.name, newUser.email, newUser.uid);
    const insertedUser = await UserDAL.getUser(newUser.uid, "test");

    // then
    expect(insertedUser.email).toBe(newUser.email);
    expect(insertedUser.uid).toBe(newUser.uid);
    expect(insertedUser.name).toBe(newUser.name);
  });

  it("should error if the user already exists", async () => {
    // given
    const uid = new ObjectId().toHexString();
    const newUser = {
      name: "Test",
      email: "mockemail@email.com",
      uid: uid,
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
    const name1 = "user" + new ObjectId().toHexString();
    const name2 = "user" + new ObjectId().toHexString();
    const { uid: user1 } = await UserTestData.createUser({ name: name1 });
    await UserTestData.createUser({ name: name2 });

    const testCases = [
      {
        name: name1,
        whosChecking: user1,
        expected: true,
      },
      {
        name: name1.toUpperCase(),
        whosChecking: user1,
        expected: true,
      },
      {
        name: name2,
        whosChecking: user1,
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
    const name1 = "user" + new ObjectId().toHexString();
    const name2 = "user" + new ObjectId().toHexString();
    const user1 = await UserTestData.createUser({ name: name1 });
    const user2 = await UserTestData.createUser({ name: name2 });
    const _decoy = await UserTestData.createUser();

    // when, then
    await expect(
      UserDAL.updateName(user1.uid, user2.name, user1.name)
    ).rejects.toThrow("Username already taken");
  });

  it("same usernames (different casing) should be available only for the same user", async () => {
    const name1 = "user" + new ObjectId().toHexString();
    const name2 = "user" + new ObjectId().toHexString();
    const user1 = await UserTestData.createUser({ name: name1 });
    const user2 = await UserTestData.createUser({ name: name2 });

    await UserDAL.updateName(user1.uid, name1.toUpperCase(), user1.name);

    const updatedUser1 = await UserDAL.getUser(user1.uid, "test");

    // when, then
    expect(updatedUser1.name).toBe(name1.toUpperCase());

    await expect(
      UserDAL.updateName(user2.uid, name1, user2.name)
    ).rejects.toThrow("Username already taken");
  });

  it("UserDAL.updateName should change the name of a user", async () => {
    // given
    const name = "user" + new ObjectId().toHexString();
    const renamed = "renamed" + new ObjectId().toHexString();
    const testUser = await UserTestData.createUser({ name: name });

    // when
    await UserDAL.updateName(testUser.uid, renamed, testUser.name);

    // then
    const updatedUser = await UserDAL.getUser(testUser.uid, "test");
    expect(updatedUser.name).toBe(renamed);
  });

  it("clearPb should clear the personalBests of a user", async () => {
    // given
    const testUser = await UserTestData.createUser();
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
    expect(updatedUser.personalBests).toStrictEqual({
      time: {},
      words: {},
      quote: {},
      custom: {},
      zen: {},
    });
  });

  it("autoBan should automatically ban after configured anticheat triggers", async () => {
    // given
    const testUser = await UserTestData.createUser();

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
    const testUser = await UserTestData.createUser();

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
    const testUser = await UserTestData.createUser();

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

  describe("addResultFilterPreset", () => {
    it("should return error if uid not found", async () => {
      // when, then
      await expect(
        UserDAL.addResultFilterPreset("non existing uid", mockResultFilter, 5)
      ).rejects.toThrow(
        "Maximum number of custom filters reached\nStack: add result filter preset"
      );
    });

    it("should return error if user has reached maximum", async () => {
      // given
      const { uid } = await UserTestData.createUser({
        resultFilterPresets: [mockDbResultFilter],
      });

      // when, then
      await expect(
        UserDAL.addResultFilterPreset(uid, mockResultFilter, 1)
      ).rejects.toThrow(
        "Maximum number of custom filters reached\nStack: add result filter preset"
      );
    });

    it("should handle zero maximum", async () => {
      // given
      const { uid } = await UserTestData.createUser();

      // when, then
      await expect(
        UserDAL.addResultFilterPreset(uid, mockResultFilter, 0)
      ).rejects.toThrow(
        "Maximum number of custom filters reached\nStack: add result filter preset"
      );
    });

    it("addResultFilterPreset success", async () => {
      // given
      const { uid } = await UserTestData.createUser({
        resultFilterPresets: [mockDbResultFilter],
      });

      // when
      const result = await UserDAL.addResultFilterPreset(
        uid,
        { ...mockResultFilter },
        2
      );

      // then
      const read = await UserDAL.getUser(uid, "read");
      const createdFilter = read.resultFilterPresets ?? [];

      expect(result).toStrictEqual(createdFilter[1]?._id);
    });
  });

  describe("removeResultFilterPreset", () => {
    it("should return error if uid not found", async () => {
      // when, then
      await expect(
        UserDAL.removeResultFilterPreset(
          "non existing uid",
          new ObjectId().toHexString()
        )
      ).rejects.toThrow("Custom filter not found\nStack: remove result filter");
    });

    it("should return error if filter is unknown", async () => {
      // given
      const { uid } = await UserTestData.createUser({
        resultFilterPresets: [mockDbResultFilter],
      });

      // when, then
      await expect(
        UserDAL.removeResultFilterPreset(uid, new ObjectId().toHexString())
      ).rejects.toThrow("Custom filter not found\nStack: remove result filter");
    });
    it("should remove filter", async () => {
      // given
      const filterOne = { ...mockDbResultFilter, _id: new ObjectId() };
      const filterTwo = { ...mockDbResultFilter, _id: new ObjectId() };
      const filterThree = { ...mockDbResultFilter, _id: new ObjectId() };
      const { uid } = await UserTestData.createUser({
        resultFilterPresets: [filterOne, filterTwo, filterThree],
      });

      // when, then
      await UserDAL.removeResultFilterPreset(uid, filterTwo._id.toHexString());

      const read = await UserDAL.getUser(uid, "read");
      expect(read.resultFilterPresets).toStrictEqual([filterOne, filterThree]);
    });
  });

  describe("addTag", () => {
    it("should return error if uid not found", async () => {
      // when, then
      await expect(
        UserDAL.addTag("non existing uid", "tagName")
      ).rejects.toThrow("Maximum number of tags reached\nStack: add tag");
    });

    it("should return error if user has reached maximum", async () => {
      // given
      const { uid } = await UserTestData.createUser({
        tags: new Array(15).fill(0).map(() => ({
          _id: new ObjectId(),
          name: "any",
          personalBests: {} as any,
        })),
      });

      // when, then
      await expect(UserDAL.addTag(uid, "new")).rejects.toThrow(
        "Maximum number of tags reached\nStack: add tag"
      );
    });

    it("addTag success", async () => {
      // given
      const emptyPb: PersonalBests = {
        time: {},
        words: {},
        quote: {},
        zen: {},
        custom: {},
      };
      const { uid } = await UserTestData.createUser({
        tags: [
          {
            _id: new ObjectId(),
            name: "first",
            personalBests: emptyPb,
          },
        ],
      });

      // when
      await UserDAL.addTag(uid, "newTag");

      // then
      const read = await UserDAL.getUser(uid, "read");
      expect(read.tags).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: "first", personalBests: emptyPb }),
          expect.objectContaining({ name: "newTag", personalBests: emptyPb }),
        ])
      );
    });
  });

  describe("editTag", () => {
    it("should return error if uid not found", async () => {
      // when, then
      await expect(
        UserDAL.editTag(
          "non existing uid",
          new ObjectId().toHexString(),
          "newName"
        )
      ).rejects.toThrow("Tag not found\nStack: edit tag");
    });

    it("should fail if tag not found", async () => {
      // given
      const tagOne: UserDAL.DBUserTag = {
        _id: new ObjectId(),
        name: "one",
        personalBests: {} as any,
      };
      const { uid } = await UserTestData.createUser({
        tags: [tagOne],
      });

      // when, then
      await expect(
        UserDAL.editTag(uid, new ObjectId().toHexString(), "newName")
      ).rejects.toThrow("Tag not found\nStack: edit tag");
    });

    it("editTag success", async () => {
      // given
      const tagOne: UserDAL.DBUserTag = {
        _id: new ObjectId(),
        name: "one",
        personalBests: {} as any,
      };
      const { uid } = await UserTestData.createUser({
        tags: [tagOne],
      });

      // when
      await UserDAL.editTag(uid, tagOne._id.toHexString(), "newTagName");

      // then
      const read = await UserDAL.getUser(uid, "read");
      expect(read.tags ?? [][0]).toStrictEqual([
        { ...tagOne, name: "newTagName" },
      ]);
    });
  });

  describe("removeTag", () => {
    it("should return error if uid not found", async () => {
      // when, then
      await expect(
        UserDAL.removeTag("non existing uid", new ObjectId().toHexString())
      ).rejects.toThrow("Tag not found\nStack: remove tag");
    });

    it("should return error if tag is unknown", async () => {
      // given
      const tagOne: UserDAL.DBUserTag = {
        _id: new ObjectId(),
        name: "one",
        personalBests: {} as any,
      };
      const { uid } = await UserTestData.createUser({
        tags: [tagOne],
      });

      // when, then
      await expect(
        UserDAL.removeTag(uid, new ObjectId().toHexString())
      ).rejects.toThrow("Tag not found\nStack: remove tag");
    });
    it("should remove tag", async () => {
      // given
      const tagOne = {
        _id: new ObjectId(),
        name: "tagOne",
        personalBests: {} as any,
      };
      const tagTwo = {
        _id: new ObjectId(),
        name: "tagTwo",
        personalBests: {} as any,
      };
      const tagThree = {
        _id: new ObjectId(),
        name: "tagThree",
        personalBests: {} as any,
      };

      const { uid } = await UserTestData.createUser({
        tags: [tagOne, tagTwo, tagThree],
      });

      // when, then
      await UserDAL.removeTag(uid, tagTwo._id.toHexString());

      const read = await UserDAL.getUser(uid, "read");
      expect(read.tags).toStrictEqual([tagOne, tagThree]);
    });
  });

  describe("removeTagPb", () => {
    it("should return error if uid not found", async () => {
      // when, then
      await expect(
        UserDAL.removeTagPb("non existing uid", new ObjectId().toHexString())
      ).rejects.toThrow("Tag not found\nStack: remove tag pb");
    });

    it("should return error if tag is unknown", async () => {
      // given
      const tagOne: UserDAL.DBUserTag = {
        _id: new ObjectId(),
        name: "one",
        personalBests: {} as any,
      };
      const { uid } = await UserTestData.createUser({
        tags: [tagOne],
      });

      // when, then
      await expect(
        UserDAL.removeTagPb(uid, new ObjectId().toHexString())
      ).rejects.toThrow("Tag not found\nStack: remove tag pb");
    });
    it("should remove tag pb", async () => {
      // given
      const tagOne = {
        _id: new ObjectId(),
        name: "tagOne",
        personalBests: {
          custom: { custom: [mockPersonalBest] },
        } as PersonalBests,
      };
      const tagTwo = {
        _id: new ObjectId(),
        name: "tagTwo",
        personalBests: {
          custom: { custom: [mockPersonalBest] },
        } as PersonalBests,
      };
      const tagThree = {
        _id: new ObjectId(),
        name: "tagThree",
        personalBests: {
          custom: { custom: [mockPersonalBest] },
        } as PersonalBests,
      };

      const { uid } = await UserTestData.createUser({
        tags: [tagOne, tagTwo, tagThree],
      });

      // when, then
      await UserDAL.removeTagPb(uid, tagTwo._id.toHexString());

      const read = await UserDAL.getUser(uid, "read");
      expect(read.tags).toStrictEqual([
        tagOne,
        {
          ...tagTwo,
          personalBests: {
            time: {},
            words: {},
            quote: {},
            zen: {},
            custom: {},
          },
        },
        tagThree,
      ]);
    });
  });

  it("updateProfile should appropriately handle multiple profile updates", async () => {
    const uid = new ObjectId().toHexString();
    await UserDAL.addUser("test name", "test email", uid);

    await UserDAL.updateProfile(
      uid,
      {
        bio: "test bio",
      },
      {
        badges: [],
      }
    );

    const user = await UserDAL.getUser(uid, "test add result filters");
    expect(user.profileDetails).toStrictEqual({
      bio: "test bio",
    });
    expect(user.inventory).toStrictEqual({
      badges: [],
    });

    await UserDAL.updateProfile(
      uid,
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

    const updatedUser = await UserDAL.getUser(uid, "test add result filters");
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
      uid,
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

    const updatedUser2 = await UserDAL.getUser(uid, "test add result filters");
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
    const uid = new ObjectId().toHexString();
    await UserDAL.addUser("test name", "test email", uid);

    await UserDAL.updateProfile(
      uid,
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

    await UserDAL.incrementBananas(uid, 100);
    await UserDAL.incrementXp(uid, 15);

    await UserDAL.resetUser(uid);
    const resetUser = await UserDAL.getUser(uid, "test add result filters");

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
    const uid = new ObjectId().toHexString();
    await UserDAL.addUser("test name", "test email", uid);

    const emptyInbox = await UserDAL.getInbox(uid);

    expect(emptyInbox).toStrictEqual([]);

    await UserDAL.addToInbox(
      uid,
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

    const inbox = await UserDAL.getInbox(uid);

    expect(inbox).toStrictEqual([
      {
        subject: "Hello!",
      },
    ]);
  });

  it("addToInbox discards mail if inbox is full", async () => {
    const uid = new ObjectId().toHexString();
    await UserDAL.addUser("test name", "test email", uid);

    const config = {
      enabled: true,
      maxMail: 1,
    };

    await UserDAL.addToInbox(
      uid,
      [
        {
          subject: "Hello 1!",
        } as any,
      ],
      config
    );

    await UserDAL.addToInbox(
      uid,
      [
        {
          subject: "Hello 2!",
        } as any,
      ],
      config
    );

    const inbox = await UserDAL.getInbox(uid);

    expect(inbox).toStrictEqual([
      {
        subject: "Hello 2!",
      },
    ]);
  });

  it("addToInboxBulk should add mail to multiple users", async () => {
    const { uid: user1 } = await UserTestData.createUser();
    const { uid: user2 } = await UserTestData.createUser();

    await UserDAL.addToInboxBulk(
      [
        {
          uid: user1,
          mail: [
            {
              subject: `Hello!`,
            } as any,
          ],
        },
        {
          uid: user2,
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

    const inbox = await UserDAL.getInbox(user1);
    const inbox2 = await UserDAL.getInbox(user2);

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

  describe("updateStreak", () => {
    it("should return error if uid not found", async () => {
      // when, then
      await expect(UserDAL.updateStreak("non existing uid", 0)).rejects.toThrow(
        "User not found\nStack: calculate streak"
      );
    });

    it("updateStreak should update streak", async () => {
      const { uid } = await UserTestData.createUser();

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

        const streak = await UserDAL.updateStreak(uid, milis);

        expect(streak).toBe(expectedStreak);
      }
    });

    it("positive streak offset should award streak correctly", async () => {
      const { uid } = await UserTestData.createUser({
        streak: { hourOffset: 10 } as any,
      });

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

        const streak = await UserDAL.updateStreak(uid, milis);

        expect(streak).toBe(expectedStreak);
      }
    });

    it("negative streak offset should award streak correctly", async () => {
      const { uid } = await UserTestData.createUser({
        streak: { hourOffset: -4 } as any,
      });

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

        const streak = await UserDAL.updateStreak(uid, milis);

        expect(streak).toBe(expectedStreak);
      }
    });
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
      const year2024 = read["2024"] as any;
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
      const year2024 = read["2024"] as any;
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
      const year2024 = read["2024"] as any;
      expect(year2024[93]).toEqual(2);
    });
  });
  describe("getPartialUser", () => {
    it("should throw for unknown user", async () => {
      await expect(async () =>
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
      await expect(async () =>
        UserDAL.updateEmail("unknown", "test@example.com")
      ).rejects.toThrowError("User not found\nStack: update email");
    });
    it("should update", async () => {
      //given
      const { uid } = await UserTestData.createUser({ email: "init" });

      //when
      await expect(UserDAL.updateEmail(uid, "next")).resolves.toBe(true);

      //then
      const read = await UserDAL.getUser(uid, "read");
      expect(read.email).toEqual("next");
    });
  });
  describe("resetPb", () => {
    it("throws for nonexisting user", async () => {
      await expect(async () => UserDAL.resetPb("unknown")).rejects.toThrowError(
        "User not found\nStack: reset pb"
      );
    });
    it("should reset", async () => {
      //given
      const { uid } = await UserTestData.createUser({
        personalBests: { custom: { custom: [{ acc: 1 } as any] } } as any,
      });

      //when
      await UserDAL.resetPb(uid);

      //then
      const read = await UserDAL.getUser(uid, "read");
      expect(read.personalBests).toStrictEqual({
        time: {},
        words: {},
        quote: {},
        zen: {},
        custom: {},
      });
    });
  });
  describe("linkDiscord", () => {
    it("throws for nonexisting user", async () => {
      await expect(async () =>
        UserDAL.linkDiscord("unknown", "", "")
      ).rejects.toThrowError("User not found\nStack: link discord");
    });
    it("should update", async () => {
      //given
      const { uid } = await UserTestData.createUser({
        discordId: "discordId",
        discordAvatar: "discordAvatar",
      });

      //when
      await UserDAL.linkDiscord(uid, "newId", "newAvatar");

      //then
      const read = await UserDAL.getUser(uid, "read");
      expect(read.discordId).toEqual("newId");
      expect(read.discordAvatar).toEqual("newAvatar");
    });
  });
  describe("unlinkDiscord", () => {
    it("throws for nonexisting user", async () => {
      await expect(async () =>
        UserDAL.unlinkDiscord("unknown")
      ).rejects.toThrowError("User not found\nStack: unlink discord");
    });
    it("should update", async () => {
      //given
      const { uid } = await UserTestData.createUser({
        discordId: "discordId",
        discordAvatar: "discordAvatar",
      });

      //when
      await UserDAL.unlinkDiscord(uid);

      //then
      const read = await UserDAL.getUser(uid, "read");
      expect(read.discordId).toBeUndefined();
      expect(read.discordAvatar).toBeUndefined();
    });
  });
  describe("updateInbox", () => {
    it("claims rewards on read", async () => {
      //GIVEN
      const rewardOne: MonkeyMail = {
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
      const rewardTwo: MonkeyMail = {
        id: "3692b9f5-84fb-4d9b-bd39-9a3217b3a33a",
        body: "test",
        subject: "reward two",
        timestamp: 2,
        read: false,
        rewards: [{ type: "xp", item: 2000 }],
      };
      const rewardThree: MonkeyMail = {
        id: "0d73b3e0-dc79-4abb-bcaf-66fa6b09a58a",
        body: "test",
        subject: "reward three",
        timestamp: 3,
        read: true,
        rewards: [{ type: "xp", item: 3000 }],
      };
      const rewardFour: MonkeyMail = {
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
      const rewardOne: MonkeyMail = {
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
      const rewardTwo: MonkeyMail = {
        id: "3692b9f5-84fb-4d9b-bd39-9a3217b3a33a",
        body: "test",
        subject: "reward two",
        timestamp: 2,
        read: true,
        rewards: [{ type: "xp", item: 2000 }],
      };

      const rewardThree: MonkeyMail = {
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
      const rewardOne: MonkeyMail = {
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
      const rewardTwo: MonkeyMail = {
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
      const rewardThree: MonkeyMail = {
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
      const rewardOne: MonkeyMail = {
        id: "b5866d4c-0749-41b6-b101-3656249d39b9",
        body: "test",
        subject: "reward one",
        timestamp: 0,
        read: false,
        rewards: [{ type: "xp", item: 1000 }],
      };
      const rewardTwo: MonkeyMail = {
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
      const rewardOne: MonkeyMail = {
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
      const rewardTwo: MonkeyMail = {
        id: "3692b9f5-84fb-4d9b-bd39-9a3217b3a33a",
        body: "test",
        subject: "reward two",
        timestamp: 0,
        read: false,
        rewards: [{ type: "xp", item: 2000 }],
      };
      const rewardThree: MonkeyMail = {
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
  describe("isDiscordIdAvailable", () => {
    it("should return true for available discordId", async () => {
      const discordId = new ObjectId().toHexString();
      await expect(UserDAL.isDiscordIdAvailable(discordId)).resolves.toBe(true);
    });

    it("should return false if discordId is taken", async () => {
      // given
      const discordId = new ObjectId().toHexString();
      await UserTestData.createUser({
        discordId: discordId,
      });

      // when, then
      await expect(UserDAL.isDiscordIdAvailable(discordId)).resolves.toBe(
        false
      );
    });
  });
  describe("updateLbMemory", () => {
    it("should return error if uid not found", async () => {
      // when, then
      await expect(
        UserDAL.updateLbMemory(
          "non existing uid",
          "time",
          "15",
          "english",
          4711
        )
      ).rejects.toThrow("User not found\nStack: update lb memory");
    });

    it("updates on empty lbMemory", async () => {
      //GIVEN
      const { uid } = await UserTestData.createUser({});

      //WHEN
      await UserDAL.updateLbMemory(uid, "time", "15", "english", 4711);

      //THEN
      const read = await UserDAL.getUser(uid, "read");
      expect(read.lbMemory).toStrictEqual({
        time: {
          "15": {
            english: 4711,
          },
        },
      });
    });
    it("updates on empty lbMemory.mode", async () => {
      //GIVEN
      const { uid } = await UserTestData.createUser({
        lbMemory: { custom: {} },
      });

      //WHEN
      await UserDAL.updateLbMemory(uid, "time", "15", "english", 4711);

      //THEN
      const read = await UserDAL.getUser(uid, "read");
      expect(read.lbMemory).toStrictEqual({
        custom: {},
        time: {
          "15": {
            english: 4711,
          },
        },
      });
    });
    it("updates on empty lbMemory.mode.mode2", async () => {
      //GIVEN
      const { uid } = await UserTestData.createUser({
        lbMemory: { time: { "30": {} } },
      });

      //WHEN
      await UserDAL.updateLbMemory(uid, "time", "15", "english", 4711);

      //THEN
      const read = await UserDAL.getUser(uid, "read");
      expect(read.lbMemory).toStrictEqual({
        time: {
          "15": {
            english: 4711,
          },
          "30": {},
        },
      });
    });
  });
  describe("incrementBananas", () => {
    it("should not return error if uuid not found", async () => {
      // when, then
      await UserDAL.incrementBananas("non existing uid", 60);
    });

    it("increments bananas", async () => {
      //GIVEN
      const name = "user" + new ObjectId().toHexString();
      const { uid } = await UserTestData.createUser({
        name,
        bananas: 1,
        personalBests: {
          time: {
            "60": [
              { wpm: 100 } as PersonalBest,
              { wpm: 30 } as PersonalBest, //highest PB should be used
            ],
          },
        } as any,
      });

      //within 25% of PB

      await UserDAL.incrementBananas(uid, 75);
      const read = await UserDAL.getUser(uid, "read");
      expect(read.bananas).toEqual(2);
      expect(read.name).toEqual(name);

      //NOT within 25% of PB
      await UserDAL.incrementBananas(uid, 74);
      expect((await UserDAL.getUser(uid, "read")).bananas).toEqual(2);
    });

    it("ignores missing personalBests", async () => {
      //GIVEN
      const { uid } = await UserTestData.createUser({
        bananas: 1,
      });

      //WHEN
      await UserDAL.incrementBananas(uid, 75);

      //THEM
      expect((await UserDAL.getUser(uid, "read")).bananas).toBe(1);
    });

    it("ignores missing personalBests time", async () => {
      //GIVEN
      const { uid } = await UserTestData.createUser({
        bananas: 1,
        personalBests: {} as any,
      });

      //WHEN
      await UserDAL.incrementBananas(uid, 75);

      //THEM
      expect((await UserDAL.getUser(uid, "read")).bananas).toBe(1);
    });
    it("ignores missing personalBests time 60", async () => {
      //GIVEN
      const { uid } = await UserTestData.createUser({
        bananas: 1,
        personalBests: { time: {} } as any,
      });

      //WHEN
      await UserDAL.incrementBananas(uid, 75);

      //THEM
      expect((await UserDAL.getUser(uid, "read")).bananas).toBe(1);
    });
    it("ignores empty personalBests time 60", async () => {
      //GIVEN
      const { uid } = await UserTestData.createUser({
        bananas: 1,
        personalBests: { time: { "60": [] } } as any,
      });

      //WHEN
      await UserDAL.incrementBananas(uid, 75);

      //THEM
      expect((await UserDAL.getUser(uid, "read")).bananas).toBe(1);
    });
    it("should increment missing bananas", async () => {
      //GIVEN
      const { uid } = await UserTestData.createUser({
        personalBests: { time: { "60": [{ wpm: 100 }] } } as any,
      });

      //WHEN
      await UserDAL.incrementBananas(uid, 75);

      //THEM
      expect((await UserDAL.getUser(uid, "read")).bananas).toBe(1);
    });
  });

  describe("addTheme", () => {
    it("should return error if uid not found", async () => {
      // when, then
      await expect(
        UserDAL.addTheme("non existing uid", {
          name: "new",
          colors: [] as any,
        })
      ).rejects.toThrow(
        "Maximum number of custom themes reached\nStack: add theme"
      );
    });

    it("should return error if user has reached maximum", async () => {
      // given
      const { uid } = await UserTestData.createUser({
        customThemes: new Array(20).fill(0).map(() => ({
          _id: new ObjectId(),
          name: "any",
          colors: [] as any,
        })),
      });

      // when, then
      await expect(
        UserDAL.addTheme(uid, { name: "new", colors: [] as any })
      ).rejects.toThrow(
        "Maximum number of custom themes reached\nStack: add theme"
      );
    });

    it("addTheme success", async () => {
      // given
      const themeOne = {
        _id: new ObjectId(),
        name: "first",
        colors: new Array(10).fill("#123456") as CustomThemeColors,
      };
      const { uid } = await UserTestData.createUser({
        customThemes: [themeOne],
      });

      const newTheme = {
        name: "newTheme",
        colors: new Array(10).fill("#000000") as CustomThemeColors,
      };
      // when
      await UserDAL.addTheme(uid, { ...newTheme });

      // then
      const read = await UserDAL.getUser(uid, "read");
      expect(read.customThemes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: "first",
            colors: themeOne.colors,
          }),
          expect.objectContaining({
            name: "newTheme",
            colors: newTheme.colors,
          }),
        ])
      );
    });
  });

  describe("editTheme", () => {
    it("should return error if uid not found", async () => {
      // when, then
      await expect(
        UserDAL.editTheme("non existing uid", new ObjectId().toHexString(), {
          name: "newName",
          colors: [] as any,
        })
      ).rejects.toThrow("Custom theme not found\nStack: edit theme");
    });

    it("should fail if theme not found", async () => {
      // given
      const themeOne = {
        _id: new ObjectId(),
        name: "first",
        colors: ["green", "white", "red"] as any,
      };
      const { uid } = await UserTestData.createUser({
        customThemes: [themeOne],
      });

      // when, then
      await expect(
        UserDAL.editTheme(uid, new ObjectId().toHexString(), {
          name: "newName",
          colors: [] as any,
        })
      ).rejects.toThrow("Custom theme not found\nStack: edit theme");
    });

    it("editTheme success", async () => {
      // given
      const themeOne = {
        _id: new ObjectId(),
        name: "first",
        colors: ["green", "white", "red"] as any,
      };
      const { uid } = await UserTestData.createUser({
        customThemes: [themeOne],
      });
      // when
      await UserDAL.editTheme(uid, themeOne._id.toHexString(), {
        name: "newThemeName",
        colors: ["red", "white", "blue"] as any,
      });

      // then
      const read = await UserDAL.getUser(uid, "read");
      expect(read.customThemes ?? [][0]).toStrictEqual([
        { ...themeOne, name: "newThemeName", colors: ["red", "white", "blue"] },
      ]);
    });
  });

  describe("removeTheme", () => {
    it("should return error if uid not found", async () => {
      // when, then
      await expect(
        UserDAL.removeTheme("non existing uid", new ObjectId().toHexString())
      ).rejects.toThrow("Custom theme not found\nStack: remove theme");
    });

    it("should return error if theme is unknown", async () => {
      // given
      const themeOne = {
        _id: new ObjectId(),
        name: "first",
        colors: ["green", "white", "red"] as any,
      };
      const { uid } = await UserTestData.createUser({
        customThemes: [themeOne],
      });

      // when, then
      await expect(
        UserDAL.removeTheme(uid, new ObjectId().toHexString())
      ).rejects.toThrow("Custom theme not found\nStack: remove theme");
    });
    it("should remove theme", async () => {
      // given
      const themeOne = {
        _id: new ObjectId(),
        name: "first",
        colors: [] as any,
      };
      const themeTwo = {
        _id: new ObjectId(),
        name: "second",
        colors: [] as any,
      };

      const themeThree = {
        _id: new ObjectId(),
        name: "third",
        colors: [] as any,
      };

      const { uid } = await UserTestData.createUser({
        customThemes: [themeOne, themeTwo, themeThree],
      });

      // when, then
      await UserDAL.removeTheme(uid, themeTwo._id.toHexString());

      const read = await UserDAL.getUser(uid, "read");
      expect(read.customThemes).toStrictEqual([themeOne, themeThree]);
    });
  });

  describe("addFavoriteQuote", () => {
    it("should return error if uid not found", async () => {
      // when, then
      await expect(
        UserDAL.addFavoriteQuote("non existing uid", "english", "1", 5)
      ).rejects.toThrow(
        "Maximum number of favorite quotes reached\nStack: add favorite quote"
      );
    });

    it("should return error if user has reached maximum", async () => {
      // given
      const { uid } = await UserTestData.createUser({
        favoriteQuotes: {
          english: ["1", "2"],
          german: ["3", "4"],
          polish: ["5"],
        },
      });

      // when, then
      await expect(
        UserDAL.addFavoriteQuote(uid, "polish", "6", 5)
      ).rejects.toThrow(
        "Maximum number of favorite quotes reached\nStack: add favorite quote"
      );
    });

    it("addFavoriteQuote success", async () => {
      // given
      const { uid } = await UserTestData.createUser({
        favoriteQuotes: {
          english: ["1"],
          german: ["2"],
          polish: ["3"],
        },
      });

      // when
      await UserDAL.addFavoriteQuote(uid, "english", "4", 5);

      // then
      const read = await UserDAL.getUser(uid, "read");
      expect(read.favoriteQuotes).toStrictEqual({
        english: ["1", "4"],
        german: ["2"],
        polish: ["3"],
      });
    });

    it("should not add a quote twice", async () => {
      // given
      const { uid } = await UserTestData.createUser({
        favoriteQuotes: {
          english: ["1", "3", "4"],
          german: ["2"],
        },
      });
      // when
      await UserDAL.addFavoriteQuote(uid, "english", "4", 5);

      // then
      const read = await UserDAL.getUser(uid, "read");

      expect(read.favoriteQuotes).toStrictEqual({
        english: ["1", "3", "4"],
        german: ["2"],
      });
    });
  });

  describe("removeFavoriteQuote", () => {
    it("should return error if uid not found", async () => {
      // when, then
      await expect(
        UserDAL.removeFavoriteQuote("non existing uid", "english", "0")
      ).rejects.toThrow("User not found\nStack: remove favorite quote");
    });

    it("should not fail if quote is not favorite", async () => {
      // given
      const { uid } = await UserTestData.createUser({
        favoriteQuotes: {
          english: ["1", "2"],
        },
      });

      // when
      await UserDAL.removeFavoriteQuote(uid, "english", "3");
      await UserDAL.removeFavoriteQuote(uid, "german", "1");

      //then
      const read = await UserDAL.getUser(uid, "read");
      expect(read.favoriteQuotes).toStrictEqual({
        english: ["1", "2"],
      });
    });
    it("should remove", async () => {
      // given
      const { uid } = await UserTestData.createUser({
        favoriteQuotes: {
          english: ["1", "2", "3"],
        },
      });

      // when
      await UserDAL.removeFavoriteQuote(uid, "english", "2");

      //%hen
      const read = await UserDAL.getUser(uid, "read");
      expect(read.favoriteQuotes).toStrictEqual({
        english: ["1", "3"],
      });
    });
  });

  describe("clearStreakHourOffset", () => {
    it("should clear streak hour offset", async () => {
      // given
      const { uid } = await UserTestData.createUser({
        //@ts-expect-error
        streak: {
          hourOffset: 1,
        },
      });

      // when
      await UserDAL.clearStreakHourOffset(uid);

      //then
      const read = await UserDAL.getUser(uid, "read");
      expect(read.streak?.hourOffset).toBeUndefined();
    });
  });

  describe("getFriends", () => {
    it("get list of friends", async () => {
      //GIVEN
      const me = await UserTestData.createUser({ name: "Me" });
      const uid = me.uid;

      const friendOne = await UserTestData.createUser({
        name: "One",
        personalBests: {
          time: {
            "15": [UserTestData.pb(100)],
            "60": [UserTestData.pb(85), UserTestData.pb(90)],
          },
        } as any,
        inventory: {
          badges: [{ id: 42, selected: true }, { id: 23 }, { id: 5 }],
        },
        banned: true,
        lbOptOut: true,
        premium: { expirationTimestamp: -1 } as any,
      });
      const friendOneRequest = await createFriend({
        initiatorUid: uid,
        receiverUid: friendOne.uid,
        status: "accepted",
        lastModified: 100,
      });
      const friendTwo = await UserTestData.createUser({
        name: "Two",
        discordId: "discordId",
        discordAvatar: "discordAvatar",
        timeTyping: 600,
        startedTests: 150,
        completedTests: 125,
        streak: {
          length: 10,
          maxLength: 50,
          lastResultTimestamp: 0,
          hourOffset: -1,
        } as any,
        xp: 42,
        inventory: {
          badges: [{ id: 23 }, { id: 5 }],
        },
        premium: {
          expirationTimestamp: vi.getRealSystemTime() + 5000,
        } as any,
      });
      const friendTwoRequest = await createFriend({
        initiatorUid: uid,
        receiverUid: friendTwo.uid,
        status: "accepted",
        lastModified: 200,
      });

      const friendThree = await UserTestData.createUser({ name: "Three" });
      const friendThreeRequest = await createFriend({
        receiverUid: uid,
        initiatorUid: friendThree.uid,
        status: "accepted",
        lastModified: 300,
      });

      //non accepted
      await createFriend({ receiverUid: uid, status: "pending" });
      await createFriend({ initiatorUid: uid, status: "blocked" });

      //WHEN
      const friends = await UserDAL.getFriends(uid);

      //THEN
      expect(friends).toEqual([
        {
          uid: friendOne.uid,
          name: "One",
          lastModified: 100,
          connectionId: friendOneRequest._id,
          // oxlint-disable-next-line no-non-null-assertion
          top15: friendOne.personalBests.time["15"]![0] as any,
          // oxlint-disable-next-line no-non-null-assertion
          top60: friendOne.personalBests.time["60"]![1] as any,
          badgeId: 42,
          banned: true,
          lbOptOut: true,
          isPremium: true,
        },
        {
          uid: friendTwo.uid,
          name: "Two",
          lastModified: 200,
          connectionId: friendTwoRequest._id,
          discordId: friendTwo.discordId,
          discordAvatar: friendTwo.discordAvatar,
          timeTyping: friendTwo.timeTyping,
          startedTests: friendTwo.startedTests,
          completedTests: friendTwo.completedTests,
          streak: {
            length: friendTwo.streak?.length,
            maxLength: friendTwo.streak?.maxLength,
          },
          xp: friendTwo.xp,
          isPremium: true,
        },
        {
          uid: friendThree.uid,
          name: "Three",
          lastModified: 300,
          connectionId: friendThreeRequest._id,
        },
        {
          uid: me.uid,
          name: "Me",
        },
      ]);
    });
  });
});
