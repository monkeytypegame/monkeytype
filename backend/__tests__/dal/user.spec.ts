import { addUser, getUser } from "../../src/dal/user";

describe("UserDal", () => {
  it("should be able to insert users", async () => {
    const newUser = {
      name: "Test",
      email: "mockemail@email.com",
      uid: "userId",
    };

    await addUser(newUser.name, newUser.email, newUser.uid);
    const insertedUser = await getUser("userId", "test");

    expect(insertedUser.email).toBe(newUser.email);
    expect(insertedUser.uid).toBe(newUser.uid);
    expect(insertedUser.name).toBe(newUser.name);
  });

  it("should error if the user already exists", async () => {
    const newUser = {
      name: "Test",
      email: "mockemail@email.com",
      uid: "userId",
    };

    await addUser(newUser.name, newUser.email, newUser.uid);

    // should error because user already exists
    await expect(
      addUser(newUser.name, newUser.email, newUser.uid)
    ).rejects.toThrow("User document already exists");
  });
});
