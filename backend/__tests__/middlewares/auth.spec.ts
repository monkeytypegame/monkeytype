import * as AuthUtils from "../../src/utils/auth";
import * as Auth from "../../src/middlewares/auth";
import { DecodedIdToken } from "firebase-admin/lib/auth/token-verifier";
import { NextFunction, Request, Response } from "express";
import { getCachedConfiguration } from "../../src/init/configuration";

const mockDecodedToken: DecodedIdToken = {
  uid: "123456789",
  email: "newuser@mail.com",
  iat: 0,
} as DecodedIdToken;

jest.spyOn(AuthUtils, "verifyIdToken").mockImplementation(async (_token) => {
  return mockDecodedToken;
});

describe("middlewares/auth", () => {
  let mockRequest: Partial<MonkeyTypes.Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(async () => {
    mockRequest = {
      baseUrl: "/api/v1",
      route: {
        path: "/",
      },
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
    nextFunction = jest.fn((error) => {
      if (error) {
        throw error;
      }
      return "Next function called";
    }) as unknown as NextFunction;
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
      expect(nextFunction).toHaveBeenCalledTimes(1);
    });
    it("should allow the request if token is fresh", async () => {
      Date.now = jest.fn(() => 10000);

      const authenticateRequest = Auth.authenticateRequest({
        requireFreshToken: true,
      });

      await authenticateRequest(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      const decodedToken = mockRequest?.ctx?.decodedToken;

      expect(decodedToken?.type).toBe("Bearer");
      expect(decodedToken?.email).toBe(mockDecodedToken.email);
      expect(decodedToken?.uid).toBe(mockDecodedToken.uid);
      expect(nextFunction).toHaveBeenCalledTimes(1);
    });
  });
});
