import { RequireConfiguration } from "@monkeytype/contracts/require-configuration/index";
import { Configuration } from "@monkeytype/schemas/configuration";
import { Response } from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TsRestRequestWithContext } from "../../src/api/types";
import { verifyRequiredConfiguration } from "../../src/middlewares/configuration";
import MonkeyError from "../../src/utils/error";
import { enableMonkeyErrorExpects } from "../__testData__/monkey-error";

enableMonkeyErrorExpects();
describe("configuration middleware", () => {
  const handler = verifyRequiredConfiguration();
  const res: Response = {} as any;
  const next = vi.fn();

  beforeEach(() => {
    next.mockClear();
  });
  afterEach(() => {
    //next function must only be called once
    expect(next).toHaveBeenCalledOnce();
  });

  it("should pass without requireConfiguration", () => {
    //GIVEN
    const req = { tsRestRoute: { metadata: {} } } as any;

    //WHEN
    handler(req, res, next);

    //THEN
    expect(next).toHaveBeenCalledWith();
  });
  it("should pass for enabled configuration", () => {
    //GIVEN
    const req = givenRequest({ path: "maintenance" }, { maintenance: true });

    //WHEN
    handler(req, res, next);

    //THEN
    expect(next).toHaveBeenCalledWith();
  });
  it("should pass for enabled configuration with complex path", () => {
    //GIVEN
    const req = givenRequest(
      { path: "users.xp.streak.enabled" },
      { users: { xp: { streak: { enabled: true } as any } as any } as any },
    );

    //WHEN
    handler(req, res, next);

    //THEN
    expect(next).toHaveBeenCalledWith();
  });
  it("should fail for disabled configuration", () => {
    //GIVEN
    const req = givenRequest({ path: "maintenance" }, { maintenance: false });

    //WHEN
    handler(req, res, next);

    //THEN
    expect(next).toHaveBeenCalledWith(
      expect.toMatchMonkeyError(
        new MonkeyError(503, "This endpoint is currently unavailable."),
      ),
    );
  });
  it("should fail for disabled configuration and custom message", () => {
    //GIVEN
    const req = givenRequest(
      { path: "maintenance", invalidMessage: "Feature not enabled." },
      { maintenance: false },
    );

    //WHEN
    handler(req, res, next);

    //THEN
    expect(next).toHaveBeenCalledWith(
      expect.toMatchMonkeyError(new MonkeyError(503, "Feature not enabled.")),
    );
  });
  it("should fail for invalid path", () => {
    //GIVEN
    const req = givenRequest({ path: "invalid.path" as any }, {});

    //WHEN
    handler(req, res, next);

    //THEN
    expect(next).toHaveBeenCalledWith(
      expect.toMatchMonkeyError(
        new MonkeyError(500, 'Invalid configuration path: "invalid.path"'),
      ),
    );
  });
  it("should fail for undefined value", () => {
    //GIVEN
    const req = givenRequest(
      { path: "admin.endpointsEnabled" },
      { admin: {} as any },
    );

    //WHEN
    handler(req, res, next);

    //THEN
    expect(next).toHaveBeenCalledWith(
      expect.toMatchMonkeyError(
        new MonkeyError(
          500,
          'Required configuration doesnt exist: "admin.endpointsEnabled"',
        ),
      ),
    );
  });
  it("should fail for null value", () => {
    //GIVEN
    const req = givenRequest(
      { path: "admin.endpointsEnabled" },
      { admin: { endpointsEnabled: null as any } },
    );

    //WHEN
    handler(req, res, next);

    //THEN
    expect(next).toHaveBeenCalledWith(
      expect.toMatchMonkeyError(
        new MonkeyError(
          500,
          'Required configuration doesnt exist: "admin.endpointsEnabled"',
        ),
      ),
    );
  });
  it("should fail for non booean value", () => {
    //GIVEN
    const req = givenRequest(
      { path: "admin.endpointsEnabled" },
      { admin: { endpointsEnabled: "disabled" as any } },
    );

    //WHEN
    handler(req, res, next);

    //THEN
    expect(next).toHaveBeenCalledWith(
      expect.toMatchMonkeyError(
        new MonkeyError(
          500,
          'Required configuration is not a boolean: "admin.endpointsEnabled"',
        ),
      ),
    );
  });
  it("should pass for multiple configurations", () => {
    //GIVEN
    const req = givenRequest(
      [{ path: "maintenance" }, { path: "admin.endpointsEnabled" }],
      { maintenance: true, admin: { endpointsEnabled: true } },
    );

    //WHEN
    handler(req, res, next);

    //THEN
    expect(next).toHaveBeenCalledWith();
  });
  it("should fail for multiple configurations", () => {
    //GIVEN
    const req = givenRequest(
      [
        { path: "maintenance", invalidMessage: "maintenance mode" },
        { path: "admin.endpointsEnabled", invalidMessage: "admin disabled" },
      ],
      { maintenance: true, admin: { endpointsEnabled: false } },
    );

    //WHEN
    handler(req, res, next);

    //THEN
    expect(next).toHaveBeenCalledWith(
      expect.toMatchMonkeyError(new MonkeyError(503, "admin disabled")),
    );
  });
});

function givenRequest(
  requireConfiguration: RequireConfiguration | RequireConfiguration[],
  configuration: Partial<Configuration>,
): TsRestRequestWithContext {
  return {
    tsRestRoute: { metadata: { requireConfiguration } },
    ctx: { configuration: configuration },
  } as TsRestRequestWithContext;
}
