import {
  addUser,
  clearPb,
  getUser,
  getUsersCollection,
  updateName,
} from "../../src/dal/user";

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

const filterNot =
  <T>(predicate: (item: T) => boolean) =>
  (item: T): boolean =>
    !predicate(item);

const isEmpty = (obj: Record<string, unknown>): boolean =>
  [Object, Array].includes(
    (obj || {}).constructor as unknown as ObjectConstructor
  ) && !Object.entries(obj || {}).length;

const isNotEmpty = filterNot(isEmpty);

describe("UserDal", () => {
  it("should be able to insert users", async () => {
    // given
    const newUser = {
      name: "Test",
      email: "mockemail@email.com",
      uid: "userId",
    };

    // when
    await addUser(newUser.name, newUser.email, newUser.uid);
    const insertedUser = await getUser("userId", "test");

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
    await addUser(newUser.name, newUser.email, newUser.uid);

    // then
    // should error because user already exists
    await expect(
      addUser(newUser.name, newUser.email, newUser.uid)
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
      .map(({ name, email, uid }) => addUser(name, email, uid));
    await Promise.all(mockUsers);

    const userToUpdateNameFor = await getUser("userId0", "test");
    const userWithNameTaken = await getUser("userId1", "test");

    // when, then
    await expect(
      updateName(userToUpdateNameFor.uid, userWithNameTaken.name)
    ).rejects.toThrow("Username already taken");
  });

  it("updatename should not allow invalid usernames", async () => {
    // given
    const testUser = {
      name: "Test",
      email: "mockemail@email.com",
      uid: "userId",
    };

    await addUser(testUser.name, testUser.email, testUser.uid);

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
          updateName(testUser.uid, invalidName as unknown as string)
        ).rejects.toThrow("Invalid username")
    );
  });

  it("updateName should fail if user has changed name recently", async () => {
    // given
    const testUser = {
      name: "Test",
      email: "mockemail@email.com",
      uid: "userId",
    };

    await addUser(testUser.name, testUser.email, testUser.uid);

    // when
    await updateName(testUser.uid, "renamedTestUser");

    const updatedUser = await getUser(testUser.uid, "test");

    // then
    expect(updatedUser.name).toBe("renamedTestUser");

    await expect(updateName(updatedUser.uid, "NewValidName")).rejects.toThrow(
      "You can change your name once every 30 days"
    );
  });

  it("updateName should change the name of a user", async () => {
    // given
    const testUser = {
      name: "Test",
      email: "mockemail@email.com",
      uid: "userId",
    };

    await addUser(testUser.name, testUser.email, testUser.uid);

    // when
    await updateName(testUser.uid, "renamedTestUser");

    // then
    const updatedUser = await getUser(testUser.uid, "test");
    expect(updatedUser.name).toBe("renamedTestUser");
  });

  it("clearPb should clear the personalBests of a user", async () => {
    // given
    const testUser = {
      name: "Test",
      email: "mockemail@email.com",
      uid: "userId",
    };
    await addUser(testUser.name, testUser.email, testUser.uid);
    await getUsersCollection().updateOne(
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

    const userWithPersonalBests = await getUser(testUser.uid, "test");
    expect(
      Object.values(userWithPersonalBests.personalBests ?? {}).filter(
        isNotEmpty
      )
    ).toHaveLength(1);
    // when
    await clearPb(testUser.uid);

    // then
    const updatedUser = await getUser(testUser.uid, "test");

    expect(
      Object.values(updatedUser.personalBests ?? {}).filter(isNotEmpty)
    ).toHaveLength(0);
  });
});
