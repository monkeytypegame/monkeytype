import { Response } from "express";
import { verifyPermissions } from "../../src/middlewares/permission";
import { EndpointMetadata } from "@monkeytype/contracts/schemas/api";
import * as Misc from "../../src/utils/misc";
import * as AdminUids from "../../src/dal/admin-uids";
import * as UserDal from "../../src/dal/user";
import MonkeyError from "../../src/utils/error";

const uid = "123456789";

describe("permission middleware", () => {
  const handler = verifyPermissions();
  const res: Response = {} as any;
  const next = vi.fn();
  const getPartialUserMock = vi.spyOn(UserDal, "getPartialUser");
  const isAdminMock = vi.spyOn(AdminUids, "isAdmin");
  const isDevMock = vi.spyOn(Misc, "isDevEnvironment");

  beforeEach(() => {
    next.mockReset();
    getPartialUserMock.mockReset().mockResolvedValue({} as any);
    isDevMock.mockReset().mockReturnValue(false);
    isAdminMock.mockReset().mockResolvedValue(false);
  });
  afterEach(() => {
    //next function must only be called once
    expect(next).toHaveBeenCalledOnce();
  });

  it("should bypass without requiredPermission", async () => {
    //GIVEN
    const req = givenRequest({});
    //WHEN
    await handler(req, res, next);

    //THEN
    expect(next).toHaveBeenCalledWith();
  });
  it("should bypass with empty requiredPermission", async () => {
    //GIVEN
    const req = givenRequest({ requirePermission: [] });
    //WHEN
    await handler(req, res, next);

    //THE
    expect(next).toHaveBeenCalledWith();
  });

  describe("admin check", () => {
    const requireAdminPermission: EndpointMetadata = {
      requirePermission: "admin",
    };

    it("should fail without authentication", async () => {
      //GIVEN
      const req = givenRequest(requireAdminPermission);
      //WHEN
      await handler(req, res, next);

      //THEN
      expect(next).toHaveBeenCalledWith(
        new MonkeyError(403, "You don't have permission to do this.")
      );
    });
    it("should pass without authentication if publicOnDev on dev", async () => {
      //GIVEN
      isDevMock.mockReturnValue(true);
      const req = givenRequest(
        {
          ...requireAdminPermission,
          authenticationOptions: { isPublicOnDev: true },
        },
        { uid }
      );
      //WHEN
      await handler(req, res, next);

      //THEN
      expect(next).toHaveBeenCalledWith();
    });
    it("should fail without authentication if publicOnDev on prod ", async () => {
      //GIVEN
      const req = givenRequest(
        {
          ...requireAdminPermission,
          authenticationOptions: { isPublicOnDev: true },
        },
        { uid }
      );
      //WHEN
      await handler(req, res, next);

      //THEN
      expect(next).toHaveBeenCalledWith(
        new MonkeyError(403, "You don't have permission to do this.")
      );
    });
    it("should fail without admin permissions", async () => {
      //GIVEN
      const req = givenRequest(requireAdminPermission, { uid });

      //WHEN
      await handler(req, res, next);

      //THEN
      expect(next).toHaveBeenCalledWith(
        new MonkeyError(403, "You don't have permission to do this.")
      );
      expect(isAdminMock).toHaveBeenCalledWith(uid);
    });
  });
  describe("user checks", () => {
    it("should fetch user only once", async () => {
      //GIVEN
      const req = givenRequest(
        {
          requirePermission: ["canReport", "canManageApeKeys"],
        },
        { uid }
      );

      //WHEN
      await handler(req, res, next);

      //THEN
      expect(getPartialUserMock).toHaveBeenCalledOnce();
      expect(getPartialUserMock).toHaveBeenCalledWith(
        uid,
        "check user permissions",
        ["canReport", "canManageApeKeys"]
      );
    });
    it("should fail if authentication is missing", async () => {
      //GIVEN
      const req = givenRequest({
        requirePermission: ["canReport", "canManageApeKeys"],
      });

      //WHEN
      await handler(req, res, next);

      //THEN
      expect(next).toHaveBeenCalledWith(
        new MonkeyError(
          403,
          "Failed to check permissions, authentication required."
        )
      );
    });
  });
  describe("quoteMod check", () => {
    const requireQuoteMod: EndpointMetadata = {
      requirePermission: "quoteMod",
    };

    it("should pass for quoteAdmin", async () => {
      //GIVEN
      getPartialUserMock.mockResolvedValue({ quoteMod: true } as any);
      const req = givenRequest(requireQuoteMod, { uid });

      //WHEN
      await handler(req, res, next);

      //THEN
      expect(next).toHaveBeenCalledWith();
      expect(getPartialUserMock).toHaveBeenCalledWith(
        uid,
        "check user permissions",
        ["quoteMod"]
      );
    });
    it("should pass for specific language", async () => {
      //GIVEN
      getPartialUserMock.mockResolvedValue({ quoteMod: "english" } as any);
      const req = givenRequest(requireQuoteMod, { uid });

      //WHEN
      await handler(req, res, next);

      //THEN
      expect(next).toHaveBeenCalledWith();
      expect(getPartialUserMock).toHaveBeenCalledWith(
        uid,
        "check user permissions",
        ["quoteMod"]
      );
    });
    it("should fail for empty string", async () => {
      //GIVEN
      getPartialUserMock.mockResolvedValue({ quoteMod: "" } as any);
      const req = givenRequest(requireQuoteMod, { uid });

      //WHEN
      await handler(req, res, next);

      //THEN
      expect(next).toHaveBeenCalledWith(
        new MonkeyError(403, "You don't have permission to do this.")
      );
    });
    it("should fail for missing quoteMod", async () => {
      //GIVEN
      getPartialUserMock.mockResolvedValue({} as any);
      const req = givenRequest(requireQuoteMod, { uid });

      //WHEN
      await handler(req, res, next);

      //THEN
      expect(next).toHaveBeenCalledWith(
        new MonkeyError(403, "You don't have permission to do this.")
      );
    });
  });
  describe("canReport check", () => {
    const requireCanReport: EndpointMetadata = {
      requirePermission: "canReport",
    };

    it("should fail if user cannot report", async () => {
      //GIVEN
      getPartialUserMock.mockResolvedValue({ canReport: false } as any);
      const req = givenRequest(requireCanReport, { uid });

      //WHEN
      await handler(req, res, next);

      //THEN
      expect(next).toHaveBeenCalledWith(
        new MonkeyError(403, "You don't have permission to do this.")
      );
      expect(getPartialUserMock).toHaveBeenCalledWith(
        uid,
        "check user permissions",
        ["canReport"]
      );
    });
    it("should pass if user can report", async () => {
      //GIVEN
      getPartialUserMock.mockResolvedValue({ canReport: true } as any);
      const req = givenRequest(requireCanReport, { uid });

      //WHEN
      await handler(req, res, next);

      //THEN
      expect(next).toHaveBeenCalledWith();
    });
    it("should pass if canReport is not set", async () => {
      //GIVEN
      getPartialUserMock.mockResolvedValue({} as any);
      const req = givenRequest(requireCanReport, { uid });

      //WHEN
      await handler(req, res, next);

      //THEN
      expect(next).toHaveBeenCalledWith();
    });
  });
  describe("canManageApeKeys check", () => {
    const requireCanReport: EndpointMetadata = {
      requirePermission: "canManageApeKeys",
    };

    it("should fail if user cannot report", async () => {
      //GIVEN
      getPartialUserMock.mockResolvedValue({ canManageApeKeys: false } as any);
      const req = givenRequest(requireCanReport, { uid });

      //WHEN
      await handler(req, res, next);

      //THEN
      expect(next).toHaveBeenCalledWith(
        new MonkeyError(
          403,
          "You have lost access to ape keys, please contact support"
        )
      );
      expect(getPartialUserMock).toHaveBeenCalledWith(
        uid,
        "check user permissions",
        ["canManageApeKeys"]
      );
    });
    it("should pass if user can report", async () => {
      //GIVEN
      getPartialUserMock.mockResolvedValue({ canManageApeKeys: true } as any);
      const req = givenRequest(requireCanReport, { uid });

      //WHEN
      await handler(req, res, next);

      //THEN
      expect(next).toHaveBeenCalledWith();
    });
    it("should pass if canManageApeKeys is not set", async () => {
      //GIVEN
      getPartialUserMock.mockResolvedValue({} as any);
      const req = givenRequest(requireCanReport, { uid });

      //WHEN
      await handler(req, res, next);

      //THEN
      expect(next).toHaveBeenCalledWith();
    });
  });
});

function givenRequest(
  metadata: EndpointMetadata,
  decodedToken?: Partial<MonkeyTypes.DecodedToken>
): TsRestRequest {
  return { tsRestRoute: { metadata }, ctx: { decodedToken } } as any;
}
