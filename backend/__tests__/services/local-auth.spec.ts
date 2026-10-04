import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { Request, Response } from "express";
import * as db from "../../src/init/db";
import * as RedisClient from "../../src/init/redis";
import * as UserDAL from "../../src/dal/user";
import * as BlocklistDAL from "../../src/dal/blocklist";
import * as LocalAuth from "../../src/services/local-auth";
import { IdSchema } from "@monkeytype/schemas/util";

const token = "a".repeat(64);
const findOne = vi.fn();
const updateOne = vi.fn();
const get = vi.fn();
const set = vi.fn();
const del = vi.fn();
const credential = {
  uid: "test_uid",
  email: "test@example.com",
  sessionVersion: "version-1",
};

function request(method = "GET", headers: Request["headers"] = {}): Request {
  return {
    method,
    headers: { cookie: `mt_session=${token}`, ...headers },
  } as Request;
}

describe("local authentication", () => {
  beforeEach(() => {
    vi.stubEnv("FRONTEND_URL", "http://localhost:8080");
    findOne.mockResolvedValue(credential);
    updateOne.mockResolvedValue({ matchedCount: 1 });
    get.mockResolvedValue(
      JSON.stringify({
        uid: credential.uid,
        version: credential.sessionVersion,
        authenticatedAt: Date.now(),
      }),
    );
    vi.spyOn(db, "collection").mockReturnValue({ findOne, updateOne } as never);
    vi.spyOn(RedisClient, "getConnection").mockReturnValue({
      get,
      set,
      del,
    } as never);
    vi.spyOn(UserDAL, "getPartialUser").mockResolvedValue({
      name: "tester",
      email: credential.email,
    } as never);
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("salts password hashes and rejects wrong passwords", async () => {
    const first = await LocalAuth.hashPassword("Testing123!");
    const second = await LocalAuth.hashPassword("Testing123!");
    expect(first).not.toEqual(second);
    expect(first).not.toContain("Testing123!");
    expect(await LocalAuth.checkPassword("Testing123!", first)).toBe(true);
    expect(await LocalAuth.checkPassword("Wrong123!", first)).toBe(false);
    expect(await LocalAuth.checkPassword("Testing123!", "invalid")).toBe(false);
  }, 15000);

  it("rejects weak new passwords", async () => {
    await expect(LocalAuth.hashPassword("short")).rejects.toThrow();
  });

  it("creates IDs accepted by existing result and profile contracts", async () => {
    const insertOne = vi.fn().mockResolvedValue({});
    vi.mocked(db.collection).mockReturnValue({ insertOne } as never);
    vi.spyOn(UserDAL, "isNameAvailable").mockResolvedValue(true);
    vi.spyOn(BlocklistDAL, "contains").mockResolvedValue(false);
    vi.spyOn(UserDAL, "addUser").mockResolvedValue(undefined);
    const uid = await LocalAuth.register(
      "tester",
      credential.email,
      "Testing123!",
    );
    expect(IdSchema.safeParse(uid).success).toBe(true);
    expect(uid).toMatch(/^[a-f0-9]{32}$/);
    expect(insertOne).toHaveBeenCalledWith(expect.objectContaining({ uid }));
    expect(UserDAL.addUser).toHaveBeenCalledWith(
      "tester",
      credential.email,
      uid,
    );
  }, 10000);

  it("accepts a current session and rejects expired, revoked and deleted accounts", async () => {
    expect((await LocalAuth.getSession(request())).uid).toBe(credential.uid);
    get.mockResolvedValue(null);
    await expect(LocalAuth.getSession(request())).rejects.toMatchObject({
      status: 401,
    });
    get.mockResolvedValue(
      JSON.stringify({ uid: credential.uid, version: "old-version" }),
    );
    await expect(LocalAuth.getSession(request())).rejects.toMatchObject({
      status: 401,
    });
    findOne.mockResolvedValue(null);
    await expect(LocalAuth.getSession(request())).rejects.toMatchObject({
      status: 401,
    });
  });

  it("requires recent password confirmation for sensitive operations", async () => {
    get.mockResolvedValue(
      JSON.stringify({
        uid: credential.uid,
        version: credential.sessionVersion,
        authenticatedAt: Date.now() - 61000,
      }),
    );
    await expect(LocalAuth.getSession(request(), true)).rejects.toMatchObject({
      status: 401,
    });
    await expect(LocalAuth.getSession(request())).resolves.toMatchObject({
      uid: credential.uid,
    });
  });

  it("rejects cross-origin and simple form requests", () => {
    expect(() => LocalAuth.verifyCsrf(request("POST"))).toThrow();
    expect(() =>
      LocalAuth.verifyCsrf(
        request("POST", {
          "x-monkeytype-client": "web",
          origin: "https://evil.example",
        }),
      ),
    ).toThrow();
    expect(() =>
      LocalAuth.verifyCsrf(
        request("POST", {
          "x-monkeytype-client": "web",
          origin: "http://localhost:8080",
        }),
      ),
    ).not.toThrow();
  });

  it("keeps session tokens out of Redis and uses secure HttpOnly cookies", async () => {
    vi.stubEnv("FRONTEND_URL", "https://typing.internal");
    const cookie = vi.fn();
    await LocalAuth.createSession(credential.uid, true, request(), {
      cookie,
      clearCookie: vi.fn(),
    } as unknown as Response);
    expect(cookie).toHaveBeenCalledWith(
      "mt_session",
      expect.stringMatching(/^[a-f0-9]{64}$/),
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      }),
    );
    const rawToken = cookie.mock.calls[0]?.[1] as string;
    expect(set.mock.calls[0]?.[0]).not.toContain(rawToken);
    expect(set.mock.calls[0]?.[1]).not.toContain(rawToken);
  });

  it("uses a browser session cookie when remember me is off", async () => {
    const cookie = vi.fn();
    await LocalAuth.createSession(credential.uid, false, request(), {
      cookie,
      clearCookie: vi.fn(),
    } as unknown as Response);
    expect(cookie.mock.calls[0]?.[2]).not.toHaveProperty("maxAge");
    expect(set).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      "EX",
      12 * 60 * 60,
    );
  });

  it("rejects login if credentials changed before the session was issued", async () => {
    await expect(
      LocalAuth.createSession(
        credential.uid,
        false,
        request(),
        {} as Response,
        "old-version",
      ),
    ).rejects.toMatchObject({ status: 401 });
  });

  it("revokes all devices when an administrator resets a password", async () => {
    await LocalAuth.resetPasswordByEmail("TEST@example.com", "Reset123!");
    expect(findOne).toHaveBeenCalledWith({ email: credential.email });
    expect(updateOne).toHaveBeenCalledWith(
      { uid: credential.uid },
      {
        $set: {
          passwordHash: expect.stringMatching(/^scrypt:/),
          sessionVersion: expect.any(String),
        },
      },
    );
  }, 10000);

  it("logs out without requiring an unexpired session", async () => {
    get.mockResolvedValue(null);
    const clearCookie = vi.fn();
    await LocalAuth.logout(request(), { clearCookie } as unknown as Response);
    expect(del).toHaveBeenCalledOnce();
    expect(clearCookie).toHaveBeenCalledWith(
      "mt_session",
      expect.objectContaining({ httpOnly: true, sameSite: "strict" }),
    );
  });
});
