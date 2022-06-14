import request from "supertest";
import app from "../../../src/app";

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
      };

      await mockApp
        .post("/users/signup")
        .send(newUser)
        .set({
          Accept: "application/json",
        })
        .expect(200);

      const response = await mockApp
        .get("/users")
        .send({
          uid: "123456789",
        })
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
});
