import { RequireConfiguration } from "@monkeytype/contracts/require-configuration/index";
import { verifyRequiredConfiguration } from "../../src/middlewares/configuration";
import { Configuration } from "@monkeytype/contracts/schemas/configuration";
import { Response } from "express";
import MonkeyError from "../../src/utils/error";
import { TsRestRequest } from "../../src/api/types";

describe("configuration middleware", () => {
  const handler = verifyRequiredConfiguration();
  const res: Response = {} as any;
  const next = vi.fn();

  beforeEach(() => {
    next.mockReset();
  });
  afterEach(() => {
    //next function must only be called once
    expect(next).toHaveBeenCalledOnce();
  });

  it("should pass without requireConfiguration", async () => {
    //GIVEN
    const req = { tsRestRoute: { metadata: {} } } as any;

    //WHEN
    await handler(req, res, next);

    //THEN
    expect(next).toHaveBeenCalledWith();
  });
  it("should pass for enabled configuration", async () => {
    //GIVEN
    const req = givenRequest({ path: "maintenance" }, { maintenance: true });

    //WHEN
    await handler(req, res, next);

    //THEN
    expect(next).toHaveBeenCalledWith();
  });
  it("should pass for enabled configuration with complex path", async () => {
    //GIVEN
    const req = givenRequest(
      { path: "users.xp.streak.enabled" },
      { users: { xp: { streak: { enabled: true } as any } as any } as any }
    );

    //WHEN
    await handler(req, res, next);

    //THEN
    expect(next).toHaveBeenCalledWith();
  });
  it("should fail for disabled configuration", async () => {
    //GIVEN
    const req = givenRequest({ path: "maintenance" }, { maintenance: false });

    //WHEN
    await handler(req, res, next);

    //THEN
    expect(next).toHaveBeenCalledWith(
      new MonkeyError(503, "This endpoint is currently unavailable.")
    );
  });
  it("should fail for disabled configuration and custom message", async () => {
    //GIVEN
    const req = givenRequest(
      { path: "maintenance", invalidMessage: "Feature not enabled." },
      { maintenance: false }
    );

    //WHEN
    await handler(req, res, next);

    //THEN
    expect(next).toHaveBeenCalledWith(
      new MonkeyError(503, "Feature not enabled.")
    );
  });
  it("should fail for invalid path", async () => {
    //GIVEN
    const req = givenRequest({ path: "invalid.path" as any }, {});

    //WHEN
    await handler(req, res, next);

    //THEN
    expect(next).toHaveBeenCalledWith(
      new MonkeyError(503, 'Invalid configuration path: "invalid.path"')
    );
  });
  it("should fail for undefined value", async () => {
    //GIVEN
    const req = givenRequest(
      { path: "admin.endpointsEnabled" },
      { admin: {} as any }
    );

    //WHEN
    await handler(req, res, next);

    //THEN
    expect(next).toHaveBeenCalledWith(
      new MonkeyError(
        500,
        'Required configuration doesnt exist: "admin.endpointsEnabled"'
      )
    );
  });
  it("should fail for null value", async () => {
    //GIVEN
    const req = givenRequest(
      { path: "admin.endpointsEnabled" },
      { admin: { endpointsEnabled: null as any } }
    );

    //WHEN
    await handler(req, res, next);

    //THEN
    expect(next).toHaveBeenCalledWith(
      new MonkeyError(
        500,
        'Required configuration doesnt exist: "admin.endpointsEnabled"'
      )
    );
  });
  it("should fail for non booean value", async () => {
    //GIVEN
    const req = givenRequest(
      { path: "admin.endpointsEnabled" },
      { admin: { endpointsEnabled: "disabled" as any } }
    );

    //WHEN
    await handler(req, res, next);

    //THEN
    expect(next).toHaveBeenCalledWith(
      new MonkeyError(
        500,
        'Required configuration is not a boolean: "admin.endpointsEnabled"'
      )
    );
  });
  it("should pass for multiple configurations", async () => {
    //GIVEN
    const req = givenRequest(
      [{ path: "maintenance" }, { path: "admin.endpointsEnabled" }],
      { maintenance: true, admin: { endpointsEnabled: true } }
    );

    //WHEN
    await handler(req, res, next);

    //THEN
    expect(next).toHaveBeenCalledWith();
  });
  it("should fail for multiple configurations", async () => {
    //GIVEN
    const req = givenRequest(
      [
        { path: "maintenance", invalidMessage: "maintenance mode" },
        { path: "admin.endpointsEnabled", invalidMessage: "admin disabled" },
      ],
      { maintenance: true, admin: { endpointsEnabled: false } }
    );

    //WHEN
    await handler(req, res, next);

    //THEN
    expect(next).toHaveBeenCalledWith(new MonkeyError(503, "admin disabled"));
  });
});

function givenRequest(
  requireConfiguration: RequireConfiguration | RequireConfiguration[],
  configuration: Partial<Configuration>
): TsRestRequest {
  return {
    tsRestRoute: { metadata: { requireConfiguration } },
    ctx: { configuration },
  } as any;
}
