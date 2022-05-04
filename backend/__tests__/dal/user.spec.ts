import { addUser } from "../../dal/user";

describe("UserDal", () => {
  it("should be able to insert users", async () => {
    const newUser = {
      name: "Test",
      email: "mockemail@email.com",
      uid: "userId",
    };

    const inserted = await addUser(newUser.name, newUser.email, newUser.uid);

    expect(inserted.acknowledged).toBeTruthy();
  });

  it("should error if the user already exists", async () => {
    const newUser = {
      name: "Test",
      email: "mockemail@email.com",
      uid: "userId",
    };

    const inserted = await addUser(newUser.name, newUser.email, newUser.uid);
    expect(inserted.acknowledged).toBeTruthy();

    // should error because user already exists
    await expect(
      addUser(newUser.name, newUser.email, newUser.uid)
    ).rejects.toThrow("User document already exists");
  });
});
