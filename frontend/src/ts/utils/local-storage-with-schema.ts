export class LocalStorageWithSchema<T> {
  private key: string;
  private schema: Zod.Schema<T>;

  constructor(key: string, schema: Zod.Schema<T>) {
    this.key = key;
    this.schema = schema;
  }

  public get(): T | undefined {
    const value = window.localStorage.getItem(this.key);

    if (value === null) {
      return undefined;
    }

    try {
      const parsed = this.schema.parse(JSON.parse(value));
      return parsed;
    } catch (e) {
      console.error(
        `Failed to get ${this.key} from localStorage, removing entry`,
        e
      );
      window.localStorage.removeItem(this.key);
      return undefined;
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
