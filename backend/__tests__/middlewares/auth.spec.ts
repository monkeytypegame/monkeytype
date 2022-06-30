// eslint-disable-line
import * as AuthUtils from "../../src/utils/auth";
import * as Auth from "../../src/middlewares/auth";
import { DecodedIdToken } from "firebase-admin/lib/auth/token-verifier";
import { NextFunction, Request, Response } from "express";
import { getCachedConfiguration } from "../../src/init/configuration";
// import { rejects } from "assert";

jest.spyOn(AuthUtils, "verifyIdToken").mockImplementation(async (_token) => {
  return {
    uid: "123456789",
    email: "newuser@mail.com",
    iat: 0,
  } as DecodedIdToken;
});

describe("middlewares/auth", () => {
  let mockRequest: Partial<MonkeyTypes.Request>;
  let mockResponse: Partial<Response>;
  const nextFunction: NextFunction = jest.fn((error) => {
    if (error) {
      throw error;
    }
  }) as unknown as NextFunction;

  beforeEach(async () => {
    mockRequest = {
      headers: {
        authorization: "Bearer 123456789",
      },
      ctx: {
        configuration: await getCachedConfiguration(true),
        decodedToken: {
          type: "None",
          uid: "",
          email: "",
        },
      },
    };
    mockResponse = {
      json: jest.fn(),
    };
  });

  describe("authenticateRequest", () => {
    it("should fail if token is not fresh", async () => {
      Date.now = jest.fn(() => 60001);

      const authenticateRequest = Auth.authenticateRequest({
        requireFreshToken: true,
      });

      let result;

      try {
        result = await authenticateRequest(
          mockRequest as Request,
          mockResponse as Response,
          nextFunction
        );
      } catch (e) {
        result = e;
      }

      expect(result.message).toBe(
        "Unauthorized\nStack: This endpoint requires a fresh token"
      );
    });
    // it("should allow the request if token is fresh", async () => {
    //   Date.now = jest.fn(() => 5);
    //   const newUser = {
    //     name: "NewUser2asdfad",
    //     uid: "123456789",
    //     email: "newuser@mail.com",
    //   };

    //   await mockApp
    //     .post("/users/signup")
    //     .send(newUser)
    //     .set({
    //       Accept: "application/json",
    //     })
    //     .expect(200);

    //   await mockApp
    //     .delete("/users")
    //     .set({
    //       Accept: "application/json",
    //       Authorization: "Bearer 123456789",
    //     })
    //     .expect(200);
    // });
  });
});
