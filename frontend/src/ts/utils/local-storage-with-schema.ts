export class LocalStorageWithSchema<T> {
  private key: string;
  private schema: Zod.Schema<T>;
  private fallback: T;
  private migrate?: (value: unknown) => T;

  constructor(
    key: string,
    schema: Zod.Schema<T>,
    fallback: T,
    migrate?: (value: unknown) => T
  ) {
    this.key = key;
    this.schema = schema;
    this.fallback = fallback;
    this.migrate = migrate;
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
    const newValue = this.migrate?.(jsonParsed) ?? this.fallback;
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
