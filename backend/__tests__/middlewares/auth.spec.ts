// eslint-disable-line
import * as AuthUtils from "../../src/utils/auth";
import * as Auth from "../../src/middlewares/auth";
import { DecodedIdToken } from "firebase-admin/lib/auth/token-verifier";
import { NextFunction, Request, Response } from "express";

jest.spyOn(AuthUtils, "verifyIdToken").mockImplementation(async (_token) => {
  return {
    uid: "123456789",
    email: "newuser@mail.com",
    iat: 0,
  } as DecodedIdToken;
});

describe("middlewares/auth", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  const nextFunction: NextFunction = jest.fn();

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      json: jest.fn(),
    };
  });

  describe("authenticateRequest", () => {
    const authenticateRequest = Auth.authenticateRequest({
      requireFreshToken: true,
    });
    it("should fail if token is not fresh", async () => {
      Date.now = jest.fn(() => 60001);

      const expectedResponse = {
        error: "Missing JWT token from the 'Authorization' header",
      };

      authenticateRequest(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.json).toBeCalledWith(expectedResponse);
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
