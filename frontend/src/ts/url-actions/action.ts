// Url actions: links the test page applies once, then drops from the url
// (apply.ts). Each link format is a module in actions/

import { compressToURI, decompressFromURI } from "lz-ts";
import { z } from "zod";

/**
 * How `param`'s value is written in the url: as is, or as json compressed
 * with lz or encoded with base64.
 */
export type UrlActionEncoding = "plain" | "lz" | "base64";

/**
 * Applied when `param` is in the search, or the hash (`in`). A hash action
 * drops the whole hash (an oauth redirect's fragment).
 */
type UrlActionBase<In extends "search" | "hash", T> = {
  in: In;
  param: string;
  encoding: UrlActionEncoding;
  /** the error notification's message when `apply` throws */
  failure: string;
  /**
   * Validates the params of the search, or the hash, with `param`'s value
   * decoded (readUrlAction)
   */
  schema: z.ZodType<T, z.ZodTypeDef, Record<string, unknown>>;
  // a method: the actions with different values share one list (apply.ts)
  /** throws if applying failed */
  apply(value: T): void | Promise<void>;
};

export type UrlSearchAction<T = unknown> = UrlActionBase<"search", T>;
export type UrlHashAction<T = unknown> = UrlActionBase<"hash", T>;
export type UrlAction<T = unknown> = UrlSearchAction<T> | UrlHashAction<T>;

/** Infers the action's value from its schema. */
export function defineUrlAction<In extends "search" | "hash", T>(
  action: UrlActionBase<In, T>,
): UrlActionBase<In, T> {
  return action;
}

/**
 * The link applying a search action. `value` is its param's value before
 * encoding: a string for plain, else json.
 */
export function urlActionLink(action: UrlSearchAction, value: unknown): string {
  return `${location.origin}?${action.param}=${encodeValue(action.encoding, value)}`;
}

function encodeValue(encoding: UrlActionEncoding, value: unknown): string {
  if (encoding === "plain") return String(value);
  const json = JSON.stringify(value);
  return encoding === "lz" ? compressToURI(json) : btoa(json);
}

/** Throws if `value` isn't valid for the encoding. */
function decodeValue(encoding: UrlActionEncoding, value: string): unknown {
  if (encoding === "plain") return value;
  const json = encoding === "lz" ? decompressFromURI(value) : atob(value);
  if (json === null || json === "") throw new Error(`invalid ${encoding}`);
  return JSON.parse(json);
}

/**
 * The action's value read from `params` (the search's, or the hash's): its
 * param decoded, then validated with its schema.
 */
export function readUrlAction<T>(
  action: UrlAction<T>,
  params: Record<string, string>,
): { success: true; data: T } | { success: false; error: string } {
  let decoded: unknown;
  try {
    decoded = decodeValue(action.encoding, params[action.param] ?? "");
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { success: false, error: `"${action.param}" ${message}` };
  }

  const parsed = action.schema.safeParse({
    ...params,
    [action.param]: decoded,
  });
  if (parsed.success) return { success: true, data: parsed.data };
  return { success: false, error: issuesMessage(parsed.error) };
}

function issuesMessage(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? `"${issue.path.join(".")}" ` : "";
      return path + issue.message;
    })
    .join(", ");
}
