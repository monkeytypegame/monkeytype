import { createEffect } from "solid-js";
import { createStore, reconcile, SetStoreFunction } from "solid-js/store";
import { LocalStorageWithSchema } from "../utils/local-storage-with-schema";

export type UseLocalStorageOptions<T extends object> = {
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
 * const [state, setState] = useLocalStorage({
 *   key: "myKey",
 *   schema: z.object({value:z.string()}),
 *   fallback: {value:"default"},
 * });
 *
 * return <div onClick={() => setState("value", "new value")}>{state.value}</div>;
 * ```
 */
export function useLocalStorageStore<T extends object>(
  options: UseLocalStorageOptions<T>,
): [T, SetStoreFunction<T>] {
  const { key, schema, fallback, migrate, syncAcrossTabs = true } = options;

  // Create the underlying localStorage manager
  const storage = new LocalStorageWithSchema({
    key,
    schema,
    fallback,
    migrate,
  });

  // Create store with initial value from storage
  const [value, setValue] = createStore<T>(storage.get());

  // Persist entire store to localStorage whenever it changes
  createEffect(() => {
    const success = storage.set(value);
    if (!success) {
      console.error(`LS ${key} failed to persist store`);
    }
  });

  // Sync changes across tabs/windows
  if (syncAcrossTabs) {
    createEffect(() => {
      const handleStorageChange = (e: StorageEvent): void => {
        if (e.key === key && e.newValue !== null) {
          console.debug(`LS ${key} Storage event detected from another tab`);
          try {
            const parsed = schema.parse(JSON.parse(e.newValue));
            setValue(reconcile(parsed));
          } catch (error) {
            console.error(
              `LS ${key} Failed to parse storage event value`,
              error,
            );
          }
        }
      };

      window.addEventListener("storage", handleStorageChange);
      return () => {
        window.removeEventListener("storage", handleStorageChange);
      };
    });
  }

  return [value, setValue];
}
