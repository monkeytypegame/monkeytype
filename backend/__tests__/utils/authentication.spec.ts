import request from "supertest";
import app from "../../src/app";
// eslint-disable-line
import * as Auth from "../../src/utils/auth";

const mockApp = request(app);

describe("Authentication", () => {
  describe("requiresFreshToken", () => {
    //@ts-ignore

    jest.spyOn(Auth, "verifyIdToken").mockImplementation(() => {
      return {
        uid: "123456789",
        email: "newuser@mail.com",
        iat: 0,
      };
    });

    it("should fail if token is not fresh", async () => {
      Date.now = jest.fn(() => 60001);
      await mockApp
        .delete("/users")
        .set({
          Accept: "application/json",
          Authorization: "Bearer 123456789",
        })
        .expect(401);
    });
    it("should allow the request if token is fresh", async () => {
      Date.now = jest.fn(() => 5);
      const newUser = {
        name: "NewUser2asdfad",
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

      await mockApp
        .delete("/users")
        .set({
          Accept: "application/json",
          Authorization: "Bearer 123456789",
        })
        .expect(200);
    });
  });
});
