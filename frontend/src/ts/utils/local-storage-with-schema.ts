import { ZodIssue } from "zod";
import { isZodError } from "@monkeytype/util/zod";
import * as Notifications from "../elements/notifications";
import { tryCatchSync } from "@monkeytype/util/trycatch";
import { parseWithSchema as parseJsonWithSchema } from "@monkeytype/util/json";

export class LocalStorageWithSchema<T> {
  private key: string;
  private schema: Zod.Schema<T>;
  private fallback: T;
  private migrate?: (
    value: Record<string, unknown> | unknown[],
    zodIssues?: ZodIssue[]
  ) => T;

  constructor(options: {
    key: string;
    schema: Zod.Schema<T>;
    fallback: T;
    migrate?: (
      value: Record<string, unknown> | unknown[],
      zodIssues?: ZodIssue[]
    ) => T;
  }) {
    this.key = options.key;
    this.schema = options.schema;
    this.fallback = options.fallback;
    this.migrate = options.migrate;
  }

  public get(): T {
    const value = window.localStorage.getItem(this.key);

    if (value === null) {
      return this.fallback;
    }

    let migrated = false;
    const { data: parsed, error } = tryCatchSync(() =>
      parseJsonWithSchema(value, this.schema, {
        fallback: this.fallback,
        migrate: (oldData, zodIssues) => {
          migrated = true;
          if (this.migrate) {
            return this.migrate(oldData, zodIssues);
          } else {
            return this.fallback;
          }
        },
      })
    );

    if (error) {
      window.localStorage.setItem(this.key, JSON.stringify(this.fallback));
      return this.fallback;
    }

    if (migrated) {
      window.localStorage.setItem(this.key, JSON.stringify(parsed));
    }
    return parsed;
  }

  public set(data: T): boolean {
    try {
      const parsed = this.schema.parse(data);
      window.localStorage.setItem(this.key, JSON.stringify(parsed));
      return true;
    } catch (e) {
      let message = "Unknown error occurred";

      if (isZodError(e)) {
        console.error(e);
        // message = e.issues
        //   .map((i) => (i.message ? i.message : JSON.stringify(i)))
        //   .join(", ");
        message = "Schema validation failed";
      } else {
        if ((e as Error).message.includes("exceeded the quota")) {
          message =
            "Local storage is full. Please clear some space and try again.";
        }
      }

      const msg = `Failed to set ${this.key} in localStorage: ${message}`;
      console.error(msg);
      Notifications.add(msg, -1);

      return false;
    }
  }
}
