import * as AuthUtils from "../../src/utils/auth";
import * as Auth from "../../src/middlewares/auth";
import { DecodedIdToken } from "firebase-admin/auth";
import { NextFunction, Request, Response } from "express";
import { getCachedConfiguration } from "../../src/init/configuration";
import * as ApeKeys from "../../src/dal/ape-keys";
import { ObjectId } from "mongodb";
import { hashSync } from "bcrypt";
import MonkeyError from "../../src/utils/error";
import * as Misc from "../../src/utils/misc";
import crypto from "crypto";
import {
  EndpointMetadata,
  RequestAuthenticationOptions,
} from "@monkeytype/contracts/schemas/api";
import * as Prometheus from "../../src/utils/prometheus";
import { TsRestRequestWithContext } from "../../src/api/types";

const mockDecodedToken: DecodedIdToken = {
  uid: "123456789",
  email: "newuser@mail.com",
  iat: 0,
} as DecodedIdToken;

vi.spyOn(AuthUtils, "verifyIdToken").mockResolvedValue(mockDecodedToken);

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
vi.spyOn(ApeKeys, "getApeKey").mockResolvedValue(mockApeKey);
vi.spyOn(ApeKeys, "updateLastUsedOn").mockResolvedValue();
const isDevModeMock = vi.spyOn(Misc, "isDevEnvironment");
let mockRequest: Partial<TsRestRequestWithContext>;
let mockResponse: Partial<Response>;
let nextFunction: NextFunction;

describe("middlewares/auth", () => {
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
      json: vi.fn(),
    };
    nextFunction = vi.fn((error) => {
      if (error) {
        throw error;
      }
      return "Next function called";
    }) as unknown as NextFunction;
  });

  afterEach(() => {
    isDevModeMock.mockReset();
  });

  describe("authenticateTsRestRequest", () => {
    const prometheusRecordAuthTimeMock = vi.spyOn(Prometheus, "recordAuthTime");
    const prometheusIncrementAuthMock = vi.spyOn(Prometheus, "incrementAuth");
    const timingSafeEqualMock = vi.spyOn(crypto, "timingSafeEqual");

    beforeEach(() => {
      timingSafeEqualMock.mockReset().mockReturnValue(true);
      [prometheusIncrementAuthMock, prometheusRecordAuthTimeMock].forEach(
        (it) => it.mockReset()
      );
    });

    it("should fail if token is not fresh", async () => {
      //GIVEN
      Date.now = vi.fn(() => 60001);

      //WHEN
      expect(() =>
        authenticate({}, { requireFreshToken: true })
      ).rejects.toThrowError(
        "Unauthorized\nStack: This endpoint requires a fresh token"
      );

      //THEN

      expect(nextFunction).not.toHaveBeenCalled();
      expect(prometheusIncrementAuthMock).not.toHaveBeenCalled();
      expect(prometheusRecordAuthTimeMock).not.toHaveBeenCalled();
    });
    it("should allow the request if token is fresh", async () => {
      //GIVEN
      Date.now = vi.fn(() => 10000);

      //WHEN
      const result = await authenticate({}, { requireFreshToken: true });

      //THEN
      const decodedToken = result.decodedToken;
      expect(decodedToken?.type).toBe("Bearer");
      expect(decodedToken?.email).toBe(mockDecodedToken.email);
      expect(decodedToken?.uid).toBe(mockDecodedToken.uid);
      expect(nextFunction).toHaveBeenCalledOnce();

      expect(prometheusIncrementAuthMock).toHaveBeenCalledWith("Bearer");
      expect(prometheusRecordAuthTimeMock).toHaveBeenCalledOnce();
    });
    it("should allow the request if apeKey is supported", async () => {
      //WHEN
      const result = await authenticate(
        { headers: { authorization: "ApeKey aWQua2V5" } },
        { acceptApeKeys: true }
      );

      //THEN
      const decodedToken = result.decodedToken;
      expect(decodedToken?.type).toBe("ApeKey");
      expect(decodedToken?.email).toBe("");
      expect(decodedToken?.uid).toBe("123");
      expect(nextFunction).toHaveBeenCalledTimes(1);
    });
    it("should fail with apeKey if apeKey is not supported", async () => {
      //WHEN
      await expect(() =>
        authenticate(
          { headers: { authorization: "ApeKey aWQua2V5" } },
          { acceptApeKeys: false }
        )
      ).rejects.toThrowError("This endpoint does not accept ApeKeys");

      //THEN
    });
    it("should fail with apeKey if apeKeys are disabled", async () => {
      //GIVEN

      //@ts-expect-error
      mockRequest.ctx.configuration.apeKeys.acceptKeys = false;

      //WHEN
      await expect(() =>
        authenticate(
          { headers: { authorization: "ApeKey aWQua2V5" } },
          { acceptApeKeys: false }
        )
      ).rejects.toThrowError("ApeKeys are not being accepted at this time");

      //THEN
    });
    it("should allow the request with authentation on public endpoint", async () => {
      //WHEN
      const result = await authenticate({}, { isPublic: true });

      //THEN
      const decodedToken = result.decodedToken;
      expect(decodedToken?.type).toBe("Bearer");
      expect(decodedToken?.email).toBe(mockDecodedToken.email);
      expect(decodedToken?.uid).toBe(mockDecodedToken.uid);
      expect(nextFunction).toHaveBeenCalledTimes(1);
    });
    it("should allow the request without authentication on public endpoint", async () => {
      //WHEN
      const result = await authenticate({ headers: {} }, { isPublic: true });

      //THEN
      const decodedToken = result.decodedToken;
      expect(decodedToken?.type).toBe("None");
      expect(decodedToken?.email).toBe("");
      expect(decodedToken?.uid).toBe("");
      expect(nextFunction).toHaveBeenCalledTimes(1);

      expect(prometheusIncrementAuthMock).toHaveBeenCalledWith("None");
      expect(prometheusRecordAuthTimeMock).toHaveBeenCalledOnce();
    });
    it("should allow the request with apeKey on public endpoint", async () => {
      //WHEN
      const result = await authenticate(
        { headers: { authorization: "ApeKey aWQua2V5" } },
        { isPublic: true }
      );

      //THEN
      const decodedToken = result.decodedToken;
      expect(decodedToken?.type).toBe("ApeKey");
      expect(decodedToken?.email).toBe("");
      expect(decodedToken?.uid).toBe("123");
      expect(nextFunction).toHaveBeenCalledTimes(1);

      expect(prometheusIncrementAuthMock).toHaveBeenCalledWith("ApeKey");
      expect(prometheusRecordAuthTimeMock).toHaveBeenCalledOnce();
    });
    it("should allow request with Uid on dev", async () => {
      //WHEN
      const result = await authenticate({
        headers: { authorization: "Uid 123" },
      });

      //THEN
      const decodedToken = result.decodedToken;
      expect(decodedToken?.type).toBe("Bearer");
      expect(decodedToken?.email).toBe("");
      expect(decodedToken?.uid).toBe("123");
      expect(nextFunction).toHaveBeenCalledTimes(1);
    });
    it("should allow request with Uid and email on dev", async () => {
      const result = await authenticate({
        headers: { authorization: "Uid 123|test@example.com" },
      });

      //THEN
      const decodedToken = result.decodedToken;
      expect(decodedToken?.type).toBe("Bearer");
      expect(decodedToken?.email).toBe("test@example.com");
      expect(decodedToken?.uid).toBe("123");
      expect(nextFunction).toHaveBeenCalledTimes(1);
    });
    it("should fail request with Uid on non-dev", async () => {
      //GIVEN
      isDevModeMock.mockReturnValue(false);

      //WHEN / THEN
      await expect(() =>
        authenticate({ headers: { authorization: "Uid 123" } })
      ).rejects.toThrow(
        new MonkeyError(401, "Baerer type uid is not supported")
      );
    });
    it("should fail without authentication", async () => {
      await expect(() => authenticate({ headers: {} })).rejects.toThrowError(
        "Unauthorized\nStack: endpoint: /api/v1 no authorization header found"
      );

      //THEH
      expect(prometheusIncrementAuthMock).not.toHaveBeenCalled();
      expect(prometheusRecordAuthTimeMock).toHaveBeenCalledWith(
        "None",
        "failure",
        expect.anything(),
        expect.anything()
      );
    });
    it("should fail with empty authentication", async () => {
      await expect(() =>
        authenticate({ headers: { authorization: "" } })
      ).rejects.toThrowError(
        "Unauthorized\nStack: endpoint: /api/v1 no authorization header found"
      );

      //THEH
      expect(prometheusIncrementAuthMock).not.toHaveBeenCalled();
      expect(prometheusRecordAuthTimeMock).toHaveBeenCalledWith(
        "",
        "failure",
        expect.anything(),
        expect.anything()
      );
    });
    it("should fail with missing authentication token", async () => {
      await expect(() =>
        authenticate({ headers: { authorization: "Bearer" } })
      ).rejects.toThrowError(
        "Missing authentication token\nStack: authenticateWithAuthHeader"
      );

      //THEH
      expect(prometheusIncrementAuthMock).not.toHaveBeenCalled();
      expect(prometheusRecordAuthTimeMock).toHaveBeenCalledWith(
        "Bearer",
        "failure",
        expect.anything(),
        expect.anything()
      );
    });
    it("should fail with unknown authentication scheme", async () => {
      await expect(() =>
        authenticate({ headers: { authorization: "unknown format" } })
      ).rejects.toThrowError(
        'Unknown authentication scheme\nStack: The authentication scheme "unknown" is not implemented'
      );

      //THEH
      expect(prometheusIncrementAuthMock).not.toHaveBeenCalled();
      expect(prometheusRecordAuthTimeMock).toHaveBeenCalledWith(
        "unknown",
        "failure",
        expect.anything(),
        expect.anything()
      );
    });
    it("should record country if provided", async () => {
      const prometheusRecordRequestCountryMock = vi.spyOn(
        Prometheus,
        "recordRequestCountry"
      );

      await authenticate(
        { headers: { "cf-ipcountry": "gb" } },
        { isPublic: true }
      );

      //THEN
      expect(prometheusRecordRequestCountryMock).toHaveBeenCalledWith(
        "gb",
        expect.anything()
      );
    });
    it("should allow the request with authentation on dev public endpoint", async () => {
      //WHEN
      const result = await authenticate({}, { isPublicOnDev: true });

      //THEN
      const decodedToken = result.decodedToken;
      expect(decodedToken?.type).toBe("Bearer");
      expect(decodedToken?.email).toBe(mockDecodedToken.email);
      expect(decodedToken?.uid).toBe(mockDecodedToken.uid);
      expect(nextFunction).toHaveBeenCalledTimes(1);
    });
    it("should allow the request without authentication on dev public endpoint", async () => {
      //WHEN
      const result = await authenticate(
        { headers: {} },
        { isPublicOnDev: true }
      );

      //THEN
      const decodedToken = result.decodedToken;
      expect(decodedToken?.type).toBe("None");
      expect(decodedToken?.email).toBe("");
      expect(decodedToken?.uid).toBe("");
      expect(nextFunction).toHaveBeenCalledTimes(1);

      expect(prometheusIncrementAuthMock).toHaveBeenCalledWith("None");
      expect(prometheusRecordAuthTimeMock).toHaveBeenCalledOnce();
    });
    it("should allow the request with apeKey on dev public endpoint", async () => {
      //WHEN
      const result = await authenticate(
        { headers: { authorization: "ApeKey aWQua2V5" } },
        { acceptApeKeys: true, isPublicOnDev: true }
      );

      //THEN
      const decodedToken = result.decodedToken;
      expect(decodedToken?.type).toBe("ApeKey");
      expect(decodedToken?.email).toBe("");
      expect(decodedToken?.uid).toBe("123");
      expect(nextFunction).toHaveBeenCalledTimes(1);

      expect(prometheusIncrementAuthMock).toHaveBeenCalledWith("ApeKey");
      expect(prometheusRecordAuthTimeMock).toHaveBeenCalledOnce();
    });
    it("should allow with apeKey if apeKeys are disabled on dev public endpoint", async () => {
      //GIVEN

      //@ts-expect-error
      mockRequest.ctx.configuration.apeKeys.acceptKeys = false;

      //WHEN
      const result = await authenticate(
        { headers: { authorization: "ApeKey aWQua2V5" } },
        { acceptApeKeys: true, isPublicOnDev: true }
      );

      //THEN
      const decodedToken = result.decodedToken;
      expect(decodedToken?.type).toBe("ApeKey");
      expect(decodedToken?.email).toBe("");
      expect(decodedToken?.uid).toBe("123");
      expect(nextFunction).toHaveBeenCalledTimes(1);

      expect(prometheusIncrementAuthMock).toHaveBeenCalledWith("ApeKey");
      expect(prometheusRecordAuthTimeMock).toHaveBeenCalledOnce();
    });
    it("should allow the request with authentation on dev public endpoint in production", async () => {
      //WHEN
      isDevModeMock.mockReturnValue(false);
      const result = await authenticate({}, { isPublicOnDev: true });

      //THEN
      const decodedToken = result.decodedToken;
      expect(decodedToken?.type).toBe("Bearer");
      expect(decodedToken?.email).toBe(mockDecodedToken.email);
      expect(decodedToken?.uid).toBe(mockDecodedToken.uid);
      expect(nextFunction).toHaveBeenCalledTimes(1);
    });
    it("should fail without authentication on dev public endpoint in production", async () => {
      //WHEN
      isDevModeMock.mockReturnValue(false);

      //THEN
      await expect(() =>
        authenticate({ headers: {} }, { isPublicOnDev: true })
      ).rejects.toThrowError("Unauthorized");
    });
    it("should allow with apeKey on dev public endpoint in production", async () => {
      //WHEN
      isDevModeMock.mockReturnValue(false);
      const result = await authenticate(
        { headers: { authorization: "ApeKey aWQua2V5" } },
        { acceptApeKeys: true, isPublicOnDev: true }
      );

      //THEN
      const decodedToken = result.decodedToken;
      expect(decodedToken?.type).toBe("ApeKey");
      expect(decodedToken?.email).toBe("");
      expect(decodedToken?.uid).toBe("123");
      expect(nextFunction).toHaveBeenCalledTimes(1);

      expect(prometheusIncrementAuthMock).toHaveBeenCalledWith("ApeKey");
      expect(prometheusRecordAuthTimeMock).toHaveBeenCalledOnce();
    });
    it("should allow githubwebhook with header", async () => {
      vi.stubEnv("GITHUB_WEBHOOK_SECRET", "GITHUB_WEBHOOK_SECRET");
      //WHEN
      const result = await authenticate(
        {
          headers: { "x-hub-signature-256": "the-signature" },
          body: { action: "published", release: { id: 1 } },
        },
        { isGithubWebhook: true }
      );

      //THEN
      const decodedToken = result.decodedToken;
      expect(decodedToken?.type).toBe("GithubWebhook");
      expect(decodedToken?.email).toBe("");
      expect(decodedToken?.uid).toBe("");
      expect(nextFunction).toHaveBeenCalledTimes(1);

      expect(prometheusIncrementAuthMock).toHaveBeenCalledWith("GithubWebhook");
      expect(prometheusRecordAuthTimeMock).toHaveBeenCalledOnce();
      expect(timingSafeEqualMock).toHaveBeenCalledWith(
        Buffer.from(
          "sha256=ff0f3080539e9df19153f6b5b5780f66e558d61038e6cf5ecf4efdc7266a7751"
        ),
        Buffer.from("the-signature")
      );
    });
    it("should fail githubwebhook with mismatched signature", async () => {
      vi.stubEnv("GITHUB_WEBHOOK_SECRET", "GITHUB_WEBHOOK_SECRET");
      timingSafeEqualMock.mockReturnValue(false);

      await expect(() =>
        authenticate(
          {
            headers: { "x-hub-signature-256": "the-signature" },
            body: { action: "published", release: { id: 1 } },
          },
          { isGithubWebhook: true }
        )
      ).rejects.toThrowError("Github webhook signature invalid");

      //THEH
      expect(prometheusIncrementAuthMock).not.toHaveBeenCalled();
      expect(prometheusRecordAuthTimeMock).toHaveBeenCalledWith(
        "None",
        "failure",
        expect.anything(),
        expect.anything()
      );
    });
    it("should fail without header when endpoint is using githubwebhook", async () => {
      vi.stubEnv("GITHUB_WEBHOOK_SECRET", "GITHUB_WEBHOOK_SECRET");
      await expect(() =>
        authenticate(
          {
            headers: {},
            body: { action: "published", release: { id: 1 } },
          },
          { isGithubWebhook: true }
        )
      ).rejects.toThrowError("Missing Github signature header");

      //THEH
      expect(prometheusIncrementAuthMock).not.toHaveBeenCalled();
      expect(prometheusRecordAuthTimeMock).toHaveBeenCalledWith(
        "None",
        "failure",
        expect.anything(),
        expect.anything()
      );
    });
    it("should fail with missing GITHUB_WEBHOOK_SECRET when endpoint is using githubwebhook", async () => {
      vi.stubEnv("GITHUB_WEBHOOK_SECRET", "");
      await expect(() =>
        authenticate(
          {
            headers: { "x-hub-signature-256": "the-signature" },
            body: { action: "published", release: { id: 1 } },
          },
          { isGithubWebhook: true }
        )
      ).rejects.toThrowError("Missing Github Webhook Secret");

      //THEH
      expect(prometheusIncrementAuthMock).not.toHaveBeenCalled();
      expect(prometheusRecordAuthTimeMock).toHaveBeenCalledWith(
        "None",
        "failure",
        expect.anything(),
        expect.anything()
      );
    });
    it("should throw 500 if something went wrong when validating the signature when endpoint is using githubwebhook", async () => {
      vi.stubEnv("GITHUB_WEBHOOK_SECRET", "GITHUB_WEBHOOK_SECRET");
      timingSafeEqualMock.mockImplementation(() => {
        throw new Error("could not validate");
      });
      await expect(() =>
        authenticate(
          {
            headers: { "x-hub-signature-256": "the-signature" },
            body: { action: "published", release: { id: 1 } },
          },
          { isGithubWebhook: true }
        )
      ).rejects.toThrowError(
        "Failed to authenticate Github webhook: could not validate"
      );

      //THEH
      expect(prometheusIncrementAuthMock).not.toHaveBeenCalled();
      expect(prometheusRecordAuthTimeMock).toHaveBeenCalledWith(
        "None",
        "failure",
        expect.anything(),
        expect.anything()
      );
    });
  });
});

async function authenticate(
  request: Partial<Request>,
  authenticationOptions?: RequestAuthenticationOptions
): Promise<{ decodedToken: Auth.DecodedToken }> {
  const mergedRequest = {
    ...mockRequest,
    ...request,
    tsRestRoute: {
      metadata: { authenticationOptions } as EndpointMetadata,
    },
  } as any;

  await Auth.authenticateTsRestRequest()(
    mergedRequest,
    mockResponse as Response,
    nextFunction
  );

  return { decodedToken: mergedRequest.ctx.decodedToken };
}
