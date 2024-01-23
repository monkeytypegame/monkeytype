import * as AuthUtils from "../../src/utils/auth";
import * as Auth from "../../src/middlewares/auth";
import { DecodedIdToken } from "firebase-admin/lib/auth/token-verifier";
import { NextFunction, Request, Response } from "express";
import { getCachedConfiguration } from "../../src/init/configuration";
import * as ApeKeys from "../../src/dal/ape-keys";
import { ObjectId } from "mongodb";
import { hashSync } from "bcrypt";
import MonkeyError from "../../src/utils/error";
import * as Misc from "../../src/utils/misc";

const mockDecodedToken: DecodedIdToken = {
  uid: "123456789",
  email: "newuser@mail.com",
  iat: 0,
} as DecodedIdToken;

jest.spyOn(AuthUtils, "verifyIdToken").mockResolvedValue(mockDecodedToken);

const mockApeKey = {
  _id: new ObjectId(),
  uid: "123",
  name: "test",
  hash: hashSync("key", 5),
  createdOn: Date.now(),
  modifiedOn: Date.now(),
  lastUsedOn: Date.now(),
  useCount: 0,
  enabled: true,
};
jest.spyOn(ApeKeys, "getApeKey").mockResolvedValue(mockApeKey);
jest.spyOn(ApeKeys, "updateLastUsedOn").mockResolvedValue();
const isDevModeMock = jest.spyOn(Misc, "isDevEnvironment");

describe("middlewares/auth", () => {
  let mockRequest: Partial<MonkeyTypes.Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(async () => {
    isDevModeMock.mockReturnValue(true);
    let config = await getCachedConfiguration(true);
    config.apeKeys.acceptKeys = true;

    mockRequest = {
      baseUrl: "/api/v1",
      route: {
        path: "/",
      },
      headers: {
        authorization: "Bearer 123456789",
      },
      ctx: {
        configuration: config,
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

  afterEach(() => {
    isDevModeMock.mockReset();
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
    it("should allow the request if apeKey is supported", async () => {
      mockRequest.headers = {
        authorization: "ApeKey aWQua2V5",
      };

      const authenticateRequest = Auth.authenticateRequest({
        acceptApeKeys: true,
      });

      await authenticateRequest(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      const decodedToken = mockRequest?.ctx?.decodedToken;

      expect(decodedToken?.type).toBe("ApeKey");
      expect(decodedToken?.email).toBe("");
      expect(decodedToken?.uid).toBe("123");
      expect(nextFunction).toHaveBeenCalledTimes(1);
    });
    it("should allow the request with authentation on public endpoint", async () => {
      const authenticateRequest = Auth.authenticateRequest({
        isPublic: true,
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
    it("should allow the request without authentication on public endpoint", async () => {
      mockRequest.headers = {};

      const authenticateRequest = Auth.authenticateRequest({
        isPublic: true,
      });

      await authenticateRequest(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      const decodedToken = mockRequest?.ctx?.decodedToken;
      expect(decodedToken?.type).toBe("None");
      expect(decodedToken?.email).toBe("");
      expect(decodedToken?.uid).toBe("");
      expect(nextFunction).toHaveBeenCalledTimes(1);
    });
    it("should allow the request with apeKey on public endpoint", async () => {
      mockRequest.headers = {
        authorization: "ApeKey aWQua2V5",
      };

      const authenticateRequest = Auth.authenticateRequest({
        isPublic: true,
      });

      await authenticateRequest(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      const decodedToken = mockRequest?.ctx?.decodedToken;

      expect(decodedToken?.type).toBe("ApeKey");
      expect(decodedToken?.email).toBe("");
      expect(decodedToken?.uid).toBe("123");
      expect(nextFunction).toHaveBeenCalledTimes(1);
    });
    it("should allow request with Uid on dev", async () => {
      mockRequest.headers = {
        authorization: "Uid 123",
      };

      const authenticateRequest = Auth.authenticateRequest({});

      await authenticateRequest(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      const decodedToken = mockRequest?.ctx?.decodedToken;

      expect(decodedToken?.type).toBe("Bearer");
      expect(decodedToken?.email).toBe("");
      expect(decodedToken?.uid).toBe("123");
      expect(nextFunction).toHaveBeenCalledTimes(1);
    });
    it("should allow request with Uid and email on dev", async () => {
      mockRequest.headers = {
        authorization: "Uid 123|test@example.com",
      };

      const authenticateRequest = Auth.authenticateRequest({});

      await authenticateRequest(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      const decodedToken = mockRequest?.ctx?.decodedToken;

      expect(decodedToken?.type).toBe("Bearer");
      expect(decodedToken?.email).toBe("test@example.com");
      expect(decodedToken?.uid).toBe("123");
      expect(nextFunction).toHaveBeenCalledTimes(1);
    });
    it("should fail request with Uid on non-dev", async () => {
      isDevModeMock.mockReturnValue(false);
      mockRequest.headers = {
        authorization: "Uid 123",
      };

      const authenticateRequest = Auth.authenticateRequest({});

      await expect(() =>
        authenticateRequest(
          mockRequest as Request,
          mockResponse as Response,
          nextFunction
        )
      ).rejects.toThrow(
        new MonkeyError(401, "Baerer type uid is not supported")
      );
    });
  });
});
