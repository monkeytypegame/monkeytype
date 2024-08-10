export class LocalStorageWithSchema<T> {
  private key: string;
  private schema: Zod.Schema<T>;

  constructor(key: string, schema: Zod.Schema<T>) {
    this.key = key;
    this.schema = schema;
  }

  public get(onSchemaFail?: (value: unknown) => T): T | undefined {
    const value = window.localStorage.getItem(this.key);

    if (value === null) {
      return undefined;
    }

    let jsonParsed;
    try {
      jsonParsed = JSON.parse(value);
    } catch (e) {
      console.error(`Failed to parse ${this.key} from localStorage`, e);
      window.localStorage.removeItem(this.key);
      return undefined;
    }

    const schemaParsed = this.schema.safeParse(jsonParsed);

    if (schemaParsed.success) {
      return schemaParsed.data;
    } else {
      if (onSchemaFail) {
        return onSchemaFail(jsonParsed);
      } else {
        console.error(
          `Value from localStorage (${this.key}) failed schema validation, removing entry`,
          schemaParsed.error
        );
        window.localStorage.removeItem(this.key);
        return undefined;
      }
    }
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
