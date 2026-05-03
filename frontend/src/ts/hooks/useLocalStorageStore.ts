import { createEffect, onCleanup } from "solid-js";
import { createStore, reconcile, SetStoreFunction } from "solid-js/store";
import { LocalStorageWithSchema } from "../utils/local-storage-with-schema";

export type UseLocalStorageStoreOptions<T extends object> = {
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
 * Wraps LocalStorageWithSchema in a reactive SolidJS store.
 *
 * @example
 * ```tsx
 * const [state, setState] = useLocalStorageStore({
 *   key: "myKey",
 *   schema: z.object({value:z.string()}),
 *   fallback: {value:"default"},
 * });
 *
 * return <div onClick={() => setState("value", "new value")}>{state.value}</div>;
 * ```
 */
export function useLocalStorageStore<T extends object>(
  options: UseLocalStorageStoreOptions<T>,
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
  const [value, setValue] = createStore<T>(structuredClone(storage.get()));

  // Guard to prevent redundant persist during cross-tab sync
  let isSyncing = false;

  // Persist entire store to localStorage whenever it changes
  createEffect(() => {
    if (!isSyncing) {
      storage.set(value);
    }
  });

  // Sync changes across tabs/windows
  if (syncAcrossTabs) {
    const handleStorageChange = (e: StorageEvent): void => {
      if (e.key === key && e.newValue !== null) {
        console.debug(`LS ${key} Storage event detected from another tab`);
        try {
          const parsed = schema.parse(JSON.parse(e.newValue));
          isSyncing = true;
          setValue(reconcile(parsed));
          isSyncing = false;
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

  return [value, setValue];
}
