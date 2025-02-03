import { ZodError, ZodIssue, ZodSchema } from "zod";

/**
 * Parse a JSON string into an object and validate it against a schema
 * @param json  JSON string
 * @param schema  Zod schema to validate the JSON against
 * @returns  The parsed JSON object
 */
export function parseWithSchema<T>(json: string, schema: ZodSchema<T>): T {
  try {
    const jsonParsed = JSON.parse(json) as unknown;
    const zodParsed = schema.parse(jsonParsed);
    return zodParsed;
  } catch (error) {
    // instanceof ZodError is not working from our module
    if ((error as ZodError)["issues"] !== undefined) {
      throw new Error(
        (error as ZodError).issues.map(prettyErrorMessage).join("\n")
      );
    } else {
      throw error;
    }
  }
}

function prettyErrorMessage(issue: ZodIssue | undefined): string {
  if (issue === undefined) return "";
  const path = issue.path.length > 0 ? `"${issue.path.join(".")}" ` : "";
  return `${path}${issue.message}`;
}
