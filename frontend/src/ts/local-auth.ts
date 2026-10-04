import {
  LocalAuthUserSchema,
  type LocalAuthUser,
} from "@monkeytype/contracts/local-auth";
import { envConfig } from "virtual:env-config";

let user: LocalAuthUser | null = null;
type Callback = (success: boolean, user: LocalAuthUser | null) => Promise<void>;
let callback: Callback | undefined;
let available = false;

async function request(path: string, body?: unknown): Promise<unknown> {
  const response = await fetch(`${envConfig.backendUrl}/auth/${path}`, {
    method: body === undefined ? "GET" : "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-Monkeytype-Client": "web",
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const data: unknown = await response.json();
  if (!response.ok) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "message" in data &&
      typeof data.message === "string"
        ? data.message
        : "Authentication failed";
    throw new Error(message);
  }
  return data;
}

async function setResponse(data: unknown): Promise<void> {
  const result = LocalAuthUserSchema.parse((data as { user: unknown }).user);
  user = result;
  available = true;
  await callback?.(true, user);
}

export async function init(ready: Callback): Promise<void> {
  callback = ready;
  // A missing or expired session is normal on startup.
  const response = await fetch(`${envConfig.backendUrl}/auth/session`, {
    credentials: "include",
  });
  if (response.status === 401) {
    available = true;
    user = null;
    await callback(true, null);
  } else if (response.ok) {
    await setResponse(await response.json());
  } else {
    throw new Error("Local authentication unavailable");
  }
}

export function getAuthenticatedUser(): LocalAuthUser | null {
  return user;
}
export function isAuthAvailable(): boolean {
  return available;
}
export async function signIn(
  email: string,
  password: string,
  rememberMe: boolean,
): Promise<void> {
  await setResponse(await request("login", { email, password, rememberMe }));
}
export async function signUp(
  name: string,
  email: string,
  password: string,
): Promise<void> {
  await setResponse(
    await request("register", { name, email, password, rememberMe: true }),
  );
}
export async function reauthenticate(password: string): Promise<void> {
  await request("reauthenticate", { password });
}
export async function signOut(): Promise<void> {
  await request("logout", {});
  user = null;
  await callback?.(true, null);
}
