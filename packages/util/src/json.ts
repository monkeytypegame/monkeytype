import { z, ZodIssue } from "zod";
import { tryCatchSync } from "./trycatch";

function prettyErrorMessage(issue: ZodIssue | undefined): string {
  if (issue === undefined) return "";
  const path = issue.path.length > 0 ? `"${issue.path.join(".")}" ` : "";
  return `${path}${issue.message.toLowerCase()}`;
}

/**
 * Parse a JSON string into an object and validate it against a schema
 * @param json  JSON string
 * @param schema  Zod schema to validate the JSON against
 * @param fallbackAndMigrate  Optional object containing optional fallback value and optional migration function
 * @throws Error if JSON is invalid and no fallback is provided
 * @throws Error if JSON does not match schema and no migration function is provided
 * @returns  The parsed JSON object
 */
export function parseWithSchema<T extends z.ZodTypeAny>(
  json: string,
  schema: T,
  fallbackAndMigrate?: {
    fallback?: z.infer<T>;
    migrate?: (
      value: Record<string, unknown> | unknown[],
      zodIssues?: ZodIssue[],
    ) => z.infer<T>;
  },
): z.infer<T> {
  const { fallback, migrate } = fallbackAndMigrate ?? {};

  const { data: jsonParsed, error } = tryCatchSync(
    () => JSON.parse(json) as Record<string, unknown>,
  );

  if (error) {
    if (fallback === undefined) {
      throw new Error(`Invalid JSON: ` + error.message);
    }
    // todo fix me
    // oxlint-disable-next-line no-unsafe-return
    return fallback as z.infer<T>;
  }

  const safeParse = schema.safeParse(jsonParsed);
  if (safeParse.success) {
    return safeParse.data as T;
  }

  if (migrate === undefined) {
    throw new Error(
      `JSON does not match schema: ${safeParse.error.issues
        .map(prettyErrorMessage)
        .join(", ")}`,
    );
  }

  const migrated = migrate(jsonParsed, safeParse.error.issues);
  const safeParseMigrated = schema.safeParse(migrated);

  if (!safeParseMigrated.success) {
    if (fallback === undefined) {
      throw new Error(
        `Migrated value does not match schema: ${safeParseMigrated.error.issues
          .map(prettyErrorMessage)
          .join(", ")}`,
      );
    }
    // todo fix me
    // oxlint-disable-next-line no-unsafe-return
    return fallback as z.infer<T>;
  }

  return safeParseMigrated.data as T;
}
