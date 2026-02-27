import { createSignal, Accessor, Setter, onCleanup } from "solid-js";
import { LocalStorageWithSchema } from "../utils/local-storage-with-schema";

export type UseLocalStorageOptions<T> = {
  key: LocalStorageWithSchema<T>["key"];
  schema: LocalStorageWithSchema<T>["schema"];
  fallback: LocalStorageWithSchema<T>["fallback"];
  migrate?: LocalStorageWithSchema<T>["migrate"];
  /**
   * Whether to sync changes across tabs/windows using storage events.
   * @default true
   */
  syncAcrossTabs?: boolean;
};

/**
 * SolidJS hook for reactive localStorage with Zod schema validation.
 * Wraps LocalStorageWithSchema in a reactive SolidJS signal.
 *
 * @example
 * ```tsx
 * const [value, setValue] = useLocalStorage({
 *   key: "myKey",
 *   schema: z.string(),
 *   fallback: "default",
 * });
 *
 * return <div onClick={() => setValue("new value")}>{value()}</div>;
 * ```
 */
export function useLocalStorage<T>(
  options: UseLocalStorageOptions<T>,
): [Accessor<T>, Setter<T>] {
  const { key, schema, fallback, migrate, syncAcrossTabs = true } = options;

  // Create the underlying localStorage manager
  const storage = new LocalStorageWithSchema({
    key,
    schema,
    fallback,
    migrate,
  });

  // Create signal with initial value from storage
  const [value, setValueInternal] = createSignal<T>(storage.get());

  // Custom setter that syncs to localStorage
  const setValue = (newValue: T | ((prev: T) => T)): T => {
    const resolvedValue =
      typeof newValue === "function"
        ? (newValue as (prev: T) => T)(value())
        : newValue;

    const success = storage.set(resolvedValue);
    if (success) {
      setValueInternal(() => resolvedValue);
    }
    return resolvedValue;
  };

  // Sync changes across tabs/windows
  if (syncAcrossTabs) {
    const handleStorageChange = (e: StorageEvent): void => {
      if (e.key === key && e.newValue !== null) {
        console.debug(`LS ${key} Storage event detected from another tab`);
        try {
          const parsed = schema.parse(JSON.parse(e.newValue));
          setValueInternal(() => parsed);
        } catch (error) {
          console.error(`LS ${key} Failed to parse storage event value`, error);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    onCleanup(() => {
      window.removeEventListener("storage", handleStorageChange);
    });
  }

  return [value, setValue as Setter<T>];
}
