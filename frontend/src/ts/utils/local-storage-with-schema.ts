import { ZodIssue } from "zod";

export class LocalStorageWithSchema<T> {
  private key: string;
  private schema: Zod.Schema<T>;
  private fallback: T;
  private migrate?: (value: unknown, zodIssues: ZodIssue[]) => T;

  constructor(options: {
    key: string;
    schema: Zod.Schema<T>;
    fallback: T;
    migrate?: (value: unknown, zodIssues: ZodIssue[]) => T;
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

    let jsonParsed;
    try {
      jsonParsed = JSON.parse(value);
    } catch (e) {
      console.error(
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

    console.error(
      `Value from localStorage ${this.key} failed schema validation, migrating`,
      schemaParsed.error
    );
    const newValue =
      this.migrate?.(jsonParsed, schemaParsed.error.issues) ?? this.fallback;
    window.localStorage.setItem(this.key, JSON.stringify(newValue));
    return newValue;
  }

  public set(data: T): boolean {
    try {
      const parsed = this.schema.parse(data);
      window.localStorage.setItem(this.key, JSON.stringify(parsed));
      return true;
    } catch (e) {
      console.error(`Failed to set ${this.key} in localStorage`, e);
      return false;
    }
  }
}
