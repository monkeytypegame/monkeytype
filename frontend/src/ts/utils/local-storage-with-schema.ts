import { ZodError, ZodIssue } from "zod";
import { deepClone } from "./misc";

export class LocalStorageWithSchema<T> {
  private key: string;
  private schema: Zod.Schema<T>;
  private fallback: T;
  private migrate?: (value: unknown, zodIssues: ZodIssue[], fallback: T) => T;

  constructor(options: {
    key: string;
    schema: Zod.Schema<T>;
    fallback: T;
    migrate?: (value: unknown, zodIssues: ZodIssue[], fallback: T) => T;
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

    let jsonParsed: unknown;
    try {
      jsonParsed = JSON.parse(value);
    } catch (e) {
      console.log(
        `Value from localStorage ${this.key} was not a valid JSON, using fallback`,
        e
      );
      window.localStorage.removeItem(this.key);
      return this.fallback;
    }

    const schemaParsed = this.schema.safeParse(jsonParsed);

    if (schemaParsed.success) {
      return schemaParsed.data;
    }

    console.log(
      `Value from localStorage ${this.key} failed schema validation, migrating`,
      schemaParsed.error.issues
    );

    let newValue = this.fallback;
    if (this.migrate) {
      const migrated = this.migrate(
        jsonParsed,
        schemaParsed.error.issues,
        deepClone(this.fallback)
      );
      const parse = this.schema.safeParse(migrated);
      if (parse.success) {
        newValue = migrated;
      } else {
        console.error(
          `Value from localStorage ${this.key} failed schema validation after migration! This is very bad!`,
          parse.error.issues
        );
      }
    }

    window.localStorage.setItem(this.key, JSON.stringify(newValue));
    return newValue;
  }

  public set(data: T): boolean {
    try {
      const parsed = this.schema.parse(data);
      window.localStorage.setItem(this.key, JSON.stringify(parsed));
      return true;
    } catch (e) {
      console.error(
        `Failed to set ${this.key} in localStorage`,
        data,
        (e as ZodError).issues
      );
      return false;
    }
  }
}
