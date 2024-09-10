import { RequireConfiguration } from "@monkeytype/contracts/require-configuration/index";
import { verifyRequiredConfiguration } from "../../src/middlewares/configuration";
import { Configuration } from "@monkeytype/contracts/schemas/configuration";
import { Response } from "express";
import MonkeyError from "../../src/utils/error";

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
      new MonkeyError(503, "This service is currently unavailable.")
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
});

function givenRequest(
  requireConfiguration: RequireConfiguration,
  configuration: Partial<Configuration>
): TsRestRequest {
  return {
    tsRestRoute: { metadata: { requireConfiguration } },
    ctx: { configuration },
  } as any;
}
