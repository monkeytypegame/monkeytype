import { ZodIssue } from "zod";
import { tryCatchSync } from "./trycatch";

/**
 * Parse a JSON string into an object and validate it against a schema
 * @param json  JSON string
 * @param schema  Zod schema to validate the JSON against
 * @returns  The parsed JSON object
 */
export function parseWithSchema<T>(
  json: string,
  schema: Zod.Schema<T>,
  migrate?: (value: unknown, zodIssues?: ZodIssue[]) => T
): T {
  const { data: jsonParsed, error } = tryCatchSync(
    () => JSON.parse(json) as unknown
  );

  if (error) {
    if (migrate === undefined) {
      throw new Error(`Invalid JSON: ` + error.message);
    }
    return migrateAndRevalidate(jsonParsed, schema, migrate);
  }

  const safeParse = schema.safeParse(jsonParsed);
  if (safeParse.success) {
    return safeParse.data;
  }

  if (migrate === undefined) {
    throw new Error(
      `JSON does not match schema: ${safeParse.error.issues
        .map(prettyErrorMessage)
        .join(", ")}`
    );
  }

  return migrateAndRevalidate(
    jsonParsed,
    schema,
    migrate,
    safeParse.error.issues
  );
}

function migrateAndRevalidate<T>(
  value: unknown,
  schema: Zod.Schema<T>,
  migrate: (value: unknown, zodIssues?: ZodIssue[]) => T,
  zodIssues?: ZodIssue[]
): T {
  const migrated = migrate(value, zodIssues);
  const safeParseMigrated = schema.safeParse(migrated);

  if (!safeParseMigrated.success) {
    throw new Error(
      `Migrated value does not match schema: ${safeParseMigrated.error.issues
        .map(prettyErrorMessage)
        .join(", ")}`
    );
  }

  return safeParseMigrated.data;
}

function prettyErrorMessage(issue: ZodIssue | undefined): string {
  if (issue === undefined) return "";
  const path = issue.path.length > 0 ? `"${issue.path.join(".")}" ` : "";
  return `${path}${issue.message.toLowerCase()}`;
}
