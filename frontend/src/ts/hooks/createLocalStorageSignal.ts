import { createSignal, Accessor, getOwner, onCleanup } from "solid-js";
import { LocalStorageWithSchema } from "../utils/local-storage-with-schema";

export type LocalStorageSignalOptions<T> = {
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

/** Stores the value (or the updater's result); false if it failed validation
 * or couldn't be stored, leaving the signal unchanged. */
export type LocalStorageSetter<T> = (value: T | ((prev: T) => T)) => boolean;

/**
 * A signal backed by localStorage, validated with a Zod schema
 * (LocalStorageWithSchema).
 *
 * Works in a component or at module scope: without a reactive owner the
 * cross-tab listener lives as long as the page.
 *
 * @example
 * ```tsx
 * const [value, setValue, resetValue] = createLocalStorageSignal({
 *   key: "myKey",
 *   schema: z.string(),
 *   fallback: "default",
 * });
 *
 * return <div onClick={() => setValue("new value")}>{value()}</div>;
 * ```
 */
export function createLocalStorageSignal<T>(
  options: LocalStorageSignalOptions<T>,
): [get: Accessor<T>, set: LocalStorageSetter<T>, reset: () => void] {
  const { key, schema, fallback, migrate, syncAcrossTabs = true } = options;

  // Create the underlying localStorage manager
  const storage = new LocalStorageWithSchema({
    key,
    schema,
    fallback,
    migrate,
  });

  // Create signal with initial value from storage
  const [value, setValueInternal] = createSignal(storage.get());

  const setValue: LocalStorageSetter<T> = (newValue) => {
    const resolvedValue =
      typeof newValue === "function"
        ? (newValue as (prev: T) => T)(value())
        : newValue;

    const success = storage.set(resolvedValue);
    if (success) {
      setValueInternal(() => resolvedValue);
    }
    return success;
  };

  const reset = (): void => {
    storage.remove();
    setValueInternal(() => storage.get());
  };

  // Sync changes across tabs/windows
  if (syncAcrossTabs) {
    const handleStorageChange = (e: StorageEvent): void => {
      if (e.key !== key) return;
      console.debug(`LS ${key} Storage event detected from another tab`);
      // the other tab changed or removed it: our cached value is stale
      storage.clearCache();
      setValueInternal(() => storage.get());
    };

    window.addEventListener("storage", handleStorageChange);
    if (getOwner() !== null) {
      onCleanup(() => {
        window.removeEventListener("storage", handleStorageChange);
      });
    }
  }

  return [value, setValue, reset];
}
