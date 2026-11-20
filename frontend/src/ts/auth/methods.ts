import { NewPasswordSchema, PasswordSchema } from "@monkeytype/schemas/users";
import { typedKeys } from "@monkeytype/util/objects";
import { z, ZodString } from "zod";

import { FaObject } from "../types/font-awesome";
import { isDevEnvironment } from "../utils/env";
import { AuthMethod } from "./providers/types";
import { getAuthenticatedUser } from "./session";
import { getAuthMethods } from "./state";

type AuthMethodInfo = {
  display: string;
  fa: FaObject;
};

/**
 * auth methods, keep order from most to least preferred.
 * This is used for reauthenticate
 */
const authMethods = {
  password: {
    display: "Password",
    fa: { icon: "fa-lock" },
  },
  github: {
    display: "GitHub",
    fa: { variant: "brand", icon: "fa-github" },
  },
  google: {
    display: "Google",
    fa: { variant: "brand", icon: "fa-google" },
  },
} as const satisfies Record<AuthMethod, AuthMethodInfo>;

export function getAuthMethodDisplay(authMethod: AuthMethod): string {
  return authMethods[authMethod].display;
}

export function getAuthMethodIcon(authMethod: AuthMethod): FaObject {
  return authMethods[authMethod].fa;
}

/** The most preferred auth method the signed in user has, except `exclude`. */
export function getPreferredAuthenticationMethod(
  exclude?: AuthMethod,
): AuthMethod | undefined {
  return typedKeys(authMethods).find(
    (it) => it !== exclude && isUsingAuthentication(it),
  );
}

export function isUsingAuthentication(authMethod: AuthMethod): boolean {
  return (
    getAuthenticatedUser()?.methods.some((it) => it.method === authMethod) ??
    false
  );
}

export function isUsingPasswordAuthentication(): boolean {
  return isUsingAuthentication("password");
}

export function hasAdditionalAuthMethods(authMethod: AuthMethod): boolean {
  return typedKeys(authMethods).some(
    (it) => it !== authMethod && isUsingAuthentication(it),
  );
}

export function isUsingAuthenticationReactive(authMethod: AuthMethod): boolean {
  return getAuthMethods().some((it) => it.method === authMethod);
}

export function getAuthMethodEmailReactive(
  authMethod: AuthMethod,
): string | undefined {
  return (
    getAuthMethods().find((it) => it.method === authMethod)?.email ?? undefined
  );
}

export function hasAdditionalAuthMethodsReactive(
  authMethod: AuthMethod,
): boolean {
  return typedKeys(authMethods).some(
    (it) => it !== authMethod && isUsingAuthenticationReactive(it),
  );
}

/**
 * Returns the Zod schema for password validation.
 *
 * Set `isNew: true` for registration/creation flows (strict rules).
 * Omit it for re-authentication flows (lenient: just non-empty).
 *
 * @param options - Set `isNew: true` for password creation/registration.
 * @returns A Zod string schema.
 */
export function getPasswordSchema(options?: { isNew: boolean }): ZodString {
  if (!options?.isNew) return PasswordSchema;
  if (isDevEnvironment()) return z.string().min(6);
  return NewPasswordSchema;
}
