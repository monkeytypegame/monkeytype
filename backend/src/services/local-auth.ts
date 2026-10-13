import {
  createHash,
  randomBytes,
  randomUUID,
  scrypt,
  timingSafeEqual,
} from "crypto";
import { Request, Response, CookieOptions } from "express";
import { MongoServerError, ObjectId } from "mongodb";
import { LocalAuthUser } from "@monkeytype/contracts/local-auth";
import { NewPasswordSchema, UserEmailSchema } from "@monkeytype/schemas/users";
import * as db from "../init/db";
import * as RedisClient from "../init/redis";
import * as UserDAL from "../dal/user";
import * as BlocklistDAL from "../dal/blocklist";
import MonkeyError from "../utils/error";

const COOKIE_NAME = "mt_session";
const SESSION_NAMESPACE = "monkeytype:auth:session:";
const SCRYPT_OPTIONS = { N: 131072, r: 8, p: 1, maxmem: 192 * 1024 * 1024 };
let activePasswordOperations = 0;

async function passwordKey(password: string, salt: string): Promise<Buffer> {
  // Bound memory use even when many login requests arrive together.
  if (activePasswordOperations >= 2) {
    throw new MonkeyError(
      503,
      "Authentication busy. Please try again shortly.",
    );
  }
  activePasswordOperations++;
  try {
    return await new Promise<Buffer>((resolve, reject) => {
      scrypt(password, salt, 64, SCRYPT_OPTIONS, (error, key) => {
        if (error) reject(error);
        else resolve(key);
      });
    });
  } finally {
    activePasswordOperations--;
  }
}

type Credential = {
  uid: string;
  email: string;
  passwordHash: string;
  sessionVersion: string;
};
export type LocalSession = {
  uid: string;
  version: string;
  authenticatedAt: number;
};

function credentials(): ReturnType<typeof db.collection<Credential>> {
  return db.collection<Credential>("local-auth");
}

function redis(): NonNullable<ReturnType<typeof RedisClient.getConnection>> {
  const connection = RedisClient.getConnection();
  if (!connection) {
    throw new MonkeyError(503, "Authentication temporarily unavailable");
  }
  return connection;
}

export async function initLocalAuth(): Promise<void> {
  redis();
  await credentials().createIndex({ email: 1 }, { unique: true });
  await credentials().createIndex({ uid: 1 }, { unique: true });
  await UserDAL.getUsersCollection().createIndex({ uid: 1 }, { unique: true });
  await UserDAL.getUsersCollection().createIndex(
    { name: 1 },
    { unique: true, collation: { locale: "en", strength: 2 } },
  );
  const frontendUrl = process.env["FRONTEND_URL"];
  if (frontendUrl === undefined || frontendUrl === "") {
    throw new Error("Local authentication requires FRONTEND_URL");
  }
  const url = new URL(frontendUrl);
  if (
    url.protocol !== "https:" &&
    !(
      url.protocol === "http:" &&
      ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
    )
  ) {
    throw new Error("Local authentication requires HTTPS, except on localhost");
  }
}

export async function hashPassword(password: string): Promise<string> {
  const parsed = NewPasswordSchema.safeParse(password);
  if (!parsed.success) {
    throw new MonkeyError(
      422,
      parsed.error.issues[0]?.message ?? "Invalid password",
    );
  }
  const salt = randomBytes(16).toString("hex");
  const key = await passwordKey(password, salt);
  return `scrypt:${salt}:${key.toString("hex")}`;
}

export async function checkPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  if (password.length === 0 || password.length > 64) return false;
  const [algorithm, salt, hash] = storedHash.split(":");
  if (
    algorithm !== "scrypt" ||
    salt === undefined ||
    salt === "" ||
    hash === undefined ||
    !/^[a-f0-9]{128}$/.test(hash)
  ) {
    return false;
  }
  const key = await passwordKey(password, salt);
  return timingSafeEqual(key, Buffer.from(hash, "hex"));
}

export async function register(
  name: string,
  email: string,
  password: string,
): Promise<string> {
  // Existing result/profile contracts only allow alphanumeric IDs and underscores.
  const uid = randomBytes(16).toString("hex");
  if (!(await UserDAL.isNameAvailable(name, uid))) {
    throw new MonkeyError(409, "Username unavailable");
  }
  if (await BlocklistDAL.contains({ name, email })) {
    throw new MonkeyError(409, "Username or email blocked");
  }
  const passwordHash = await hashPassword(password);
  try {
    await credentials().insertOne({
      _id: new ObjectId(),
      uid,
      email,
      passwordHash,
      sessionVersion: randomUUID(),
    });
    await UserDAL.addUser(name, email, uid);
  } catch (error) {
    await credentials().deleteOne({ uid });
    await UserDAL.deleteUser(uid);
    if (error instanceof MongoServerError && error.code === 11000) {
      throw new MonkeyError(409, "Username or email already in use");
    }
    throw error;
  }
  return uid;
}

// Use the same expensive operation for unknown accounts to avoid a timing oracle.
const DUMMY_HASH = `scrypt:${"0".repeat(32)}:${"0".repeat(128)}`;
export async function login(
  email: string,
  password: string,
): Promise<{ uid: string; version: string }> {
  const credential = await credentials().findOne({ email });
  const valid = await checkPassword(
    password,
    credential?.passwordHash ?? DUMMY_HASH,
  );
  if (!credential || !valid) {
    throw new MonkeyError(401, "Email/password is incorrect");
  }
  await getUser(credential.uid);
  return { uid: credential.uid, version: credential.sessionVersion };
}

export async function getUser(uid: string): Promise<LocalAuthUser> {
  const user = await UserDAL.getPartialUser(uid, "local authentication", [
    "name",
    "email",
  ]);
  return {
    uid,
    email: user.email,
    emailVerified: false,
    providerData: [
      {
        uid,
        email: user.email,
        displayName: user.name,
        providerId: "password",
        photoURL: null,
        phoneNumber: null,
      },
    ],
  };
}

function sessionKey(token: string): string {
  return SESSION_NAMESPACE + createHash("sha256").update(token).digest("hex");
}

export function getSessionToken(req: Request): string | undefined {
  const token = req.headers.cookie
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE_NAME}=`))
    ?.slice(COOKIE_NAME.length + 1);
  return token !== undefined && /^[a-f0-9]{64}$/.test(token)
    ? token
    : undefined;
}

export function verifyCsrf(req: Request): void {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return;
  const origin = req.headers.origin;
  const expectedOrigin = new URL(
    process.env["FRONTEND_URL"] ?? "http://localhost",
  ).origin;
  if (
    req.headers["x-monkeytype-client"] !== "web" ||
    (origin !== undefined && origin !== expectedOrigin)
  ) {
    throw new MonkeyError(403, "Invalid request origin");
  }
}

export async function getSession(
  req: Request,
  requireFresh = false,
): Promise<LocalSession> {
  const token = getSessionToken(req);
  if (token === undefined) throw new MonkeyError(401, "Please login again");
  const serialized = await redis().get(sessionKey(token));
  if (serialized === null) {
    throw new MonkeyError(401, "Session expired - please login again");
  }
  const session = JSON.parse(serialized) as LocalSession;
  const credential = await credentials().findOne({ uid: session.uid });
  if (!credential || session.version !== credential.sessionVersion) {
    throw new MonkeyError(401, "Session revoked - please login again");
  }
  verifyCsrf(req);
  if (requireFresh && Date.now() - session.authenticatedAt > 60 * 1000) {
    throw new MonkeyError(401, "Please confirm your password again");
  }
  return session;
}

function cookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: "strict" as const,
    secure: process.env["FRONTEND_URL"]?.startsWith("https://") ?? false,
    path: "/",
  };
}

export async function createSession(
  uid: string,
  rememberMe: boolean,
  req: Request,
  res: Response,
  expectedVersion?: string,
): Promise<void> {
  const credential = await credentials().findOne({ uid });
  if (!credential) throw new MonkeyError(401, "Account not found");
  if (
    expectedVersion !== undefined &&
    credential.sessionVersion !== expectedVersion
  ) {
    throw new MonkeyError(401, "Credentials changed. Please login again");
  }
  await logout(req, res);
  const token = randomBytes(32).toString("hex");
  const duration = rememberMe ? 30 * 24 * 60 * 60 : 12 * 60 * 60;
  const session: LocalSession = {
    uid,
    version: credential.sessionVersion,
    authenticatedAt: Date.now(),
  };
  await redis().set(sessionKey(token), JSON.stringify(session), "EX", duration);
  res.cookie(COOKIE_NAME, token, {
    ...cookieOptions(),
    ...(rememberMe ? { maxAge: duration * 1000 } : {}),
  });
}

export async function reauthenticate(
  req: Request,
  password: string,
): Promise<void> {
  const session = await getSession(req);
  const credential = await credentials().findOne({ uid: session.uid });
  if (
    !credential ||
    !(await checkPassword(password, credential.passwordHash))
  ) {
    throw new MonkeyError(401, "Incorrect password");
  }
  session.authenticatedAt = Date.now();
  // XX prevents a concurrent logout from resurrecting a deleted session.
  const token = getSessionToken(req) as string;
  await redis().set(
    sessionKey(token),
    JSON.stringify(session),
    "KEEPTTL",
    "XX",
  );
}

export async function logout(req: Request, res: Response): Promise<void> {
  const token = getSessionToken(req);
  if (token !== undefined) await redis().del(sessionKey(token));
  res.clearCookie(COOKIE_NAME, cookieOptions());
}

export async function revokeSessions(uid: string): Promise<void> {
  await credentials().updateOne(
    { uid },
    { $set: { sessionVersion: randomUUID() } },
  );
}

export async function updatePassword(
  uid: string,
  password: string,
): Promise<void> {
  const passwordHash = await hashPassword(password);
  const result = await credentials().updateOne(
    { uid },
    { $set: { passwordHash, sessionVersion: randomUUID() } },
  );
  if (result.matchedCount !== 1) {
    throw new MonkeyError(404, "Account not found");
  }
}

export async function updateEmail(uid: string, email: string): Promise<void> {
  const normalizedEmail = UserEmailSchema.parse(email).toLowerCase();
  try {
    const result = await credentials().updateOne(
      { uid },
      { $set: { email: normalizedEmail, sessionVersion: randomUUID() } },
    );
    if (result.matchedCount !== 1) {
      throw new MonkeyError(404, "Account not found");
    }
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) {
      throw new MonkeyError(409, "Email already in use");
    }
    throw error;
  }
}

export async function deleteUser(uid: string): Promise<void> {
  await credentials().deleteOne({ uid });
}

export async function resetPasswordByEmail(
  email: string,
  password: string,
): Promise<void> {
  const credential = await credentials().findOne({
    email: email.toLowerCase(),
  });
  if (!credential) throw new MonkeyError(404, "Account not found");
  await updatePassword(credential.uid, password);
}
