import { z, ZodIssue } from "zod";
import { isZodError } from "./zod";

/**
 * Parse a JSON string into an object and validate it against a schema
 * @param json  JSON string
 * @param schema  Zod schema to validate the JSON against
 * @returns  The parsed JSON object
 */
export function parseWithSchema<T extends z.ZodTypeAny>(
  json: string,
  schema: T
): z.infer<T> {
  try {
    const jsonParsed = JSON.parse(json) as unknown;
    // hits is fine to ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return schema.parse(jsonParsed) as z.infer<T>;
  } catch (error) {
    if (isZodError(error)) {
      throw new Error(error.issues.map(prettyErrorMessage).join("\n"));
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
