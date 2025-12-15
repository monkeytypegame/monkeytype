import { z } from "zod";

function removeProblems<T extends object | unknown[]>(
  obj: T | undefined,
  problems: (number | string)[],
): T | undefined {
  //already removed
  if (obj === undefined) return undefined;

  if (Array.isArray(obj)) {
    if (problems.length === obj.length) return undefined;

    return obj.filter((_, index) => !problems.includes(index)) as T;
  } else {
    const entries = Object.entries(obj);
    if (problems.length === entries.length) return undefined;

    return Object.fromEntries(
      entries.filter(([key]) => !problems.includes(key)),
    ) as T;
  }
}

function getNestedValue(obj: [] | object, path: string[]): [] | object {
  //@ts-expect-error can be array or object
  // oxlint-disable-next-line no-unsafe-return
  return path.slice(0, -1).reduce((acc, it: string) => acc[it], obj);
}

/**
 * Sanitize object. Remove invalid values based on the schema.
 * @param schema zod schema
 * @param obj object
 * @returns sanitized object
 */
export function sanitize<T extends z.ZodTypeAny>(
  schema: T,
  obj: z.infer<T>,
): z.infer<T> {
  const maxAttempts = 2;
  let result;
  let current = structuredClone(obj);

  for (let attempt = 0; attempt <= maxAttempts; attempt++) {
    result = schema.safeParse(current);

    if (result.success) {
      //use the parsed data, not the obj. keys might been removed
      // oxlint-disable-next-line no-unsafe-return
      return result.data as z.infer<T>;
    }
    if (attempt === maxAttempts) {
      //exit loop and throw error
      break;
    }
    const pathsWithProblems = result.error.errors.reduce((acc, { path }) => {
      const parent = path.slice(0, -1).join(".");
      const element = path.at(-1);

      if (element !== undefined) {
        acc.set(parent, [...(acc.get(parent) ?? []), element]);
      }
      return acc;
    }, new Map<string, Array<string | number>>()) as Map<
      string, //parent path
      string[] | number[] //childs with problems
    >;

    for (const [pathString, problems] of pathsWithProblems.entries()) {
      if (pathString === "") {
        current =
          removeProblems(current, problems) ??
          (Array.isArray(current) ? [] : {});
      } else {
        const path = pathString.split(".");
        const parent = getNestedValue(current, path);
        const key = path.at(-1) as string;

        //@ts-expect-error can be object or array
        // oxlint-disable-next-line no-unsafe-assignment
        const cleaned = removeProblems(parent[key], problems);

        if (cleaned === undefined) {
          //@ts-expect-error can be object or array
          // oxlint-disable-next-line no-dynamic-delete
          delete parent[key];
        } else {
          //@ts-expect-error can be object or array
          // oxlint-disable-next-line no-unsafe-assignment
          parent[key] = cleaned;
        }
      }
    }
  }
  const errorsString = result?.error.errors
    .map((e) => `${e.path.join(".")}: ${e.message}`)
    .join(", ");
  throw new Error("unable to sanitize: " + errorsString);
}
