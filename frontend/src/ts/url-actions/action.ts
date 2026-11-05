// Url actions: links the test page applies once, then drops from the url
// (apply.ts). Each link format is a module in actions/

import { compressToURI, decompressFromURI } from "lz-ts";
import { z } from "zod";

/**
 * How `param`'s value is written in the url: as is, or as json compressed
 * with lz or encoded with base64.
 */
export type UrlActionEncoding = "plain" | "lz" | "base64";

type UrlActionBase<T> = {
  /** its presence in the url triggers the action */
  param: string;
  /** the error notification's message when `apply` throws */
  failure: string;
  // a method: the actions with different values share one list (apply.ts)
  /** throws if applying failed */
  apply(value: T): void | Promise<void>;
};

/**
 * Owns its search param, and drops only it from the url. `Input` is the
 * param's value before encoding (buildUrlActionLink).
 */
export type UrlSearchAction<T = unknown, Input = unknown> = UrlActionBase<T> & {
  in: "search";
  encoding: UrlActionEncoding;
  /** validates `param`'s decoded value */
  schema: z.ZodType<T, z.ZodTypeDef, Input>;
};

/** Owns the whole hash (an oauth redirect's fragment), and drops it. */
export type UrlHashAction<T = unknown> = UrlActionBase<T> & {
  in: "hash";
  /** validates the hash's params */
  schema: z.ZodType<T, z.ZodTypeDef, Record<string, string>>;
};

export type UrlAction<T = unknown> = UrlSearchAction<T> | UrlHashAction<T>;

/** Infers the action's value from its schema. */
export function defineSearchAction<T, Input>(
  action: UrlSearchAction<T, Input>,
): UrlSearchAction<T, Input> {
  return action;
}

/** Infers the action's value from its schema. */
export function defineHashAction<T>(
  action: UrlHashAction<T>,
): UrlHashAction<T> {
  return action;
}

/** The link applying a search action with `value`, its schema's input. */
export function buildUrlActionLink<Input>({
  action,
  value,
}: {
  action: UrlSearchAction<unknown, Input>;
  value: NoInfer<Input>;
}): string {
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
 * The action's value read from `params` (the search's, or the hash's): a
 * search action's param decoded and validated, a hash action's params
 * validated.
 */
export function readUrlAction<T>(
  action: UrlAction<T>,
  params: Record<string, string>,
): { success: true; data: T } | { success: false; error: string } {
  if (action.in === "hash") {
    const parsed = action.schema.safeParse(params);
    if (parsed.success) return { success: true, data: parsed.data };
    return { success: false, error: issuesMessage(parsed.error, []) };
  }

  let decoded: unknown;
  try {
    decoded = decodeValue(action.encoding, params[action.param] ?? "");
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { success: false, error: `"${action.param}" ${message}` };
  }

  const parsed = action.schema.safeParse(decoded);
  if (parsed.success) return { success: true, data: parsed.data };
  return { success: false, error: issuesMessage(parsed.error, [action.param]) };
}

/** The issues, each with its path (under `prefix`). */
function issuesMessage(error: z.ZodError, prefix: string[]): string {
  return error.issues
    .map((issue) => {
      const path = [...prefix, ...issue.path];
      return (path.length > 0 ? `"${path.join(".")}" ` : "") + issue.message;
    })
    .join(", ");
}
