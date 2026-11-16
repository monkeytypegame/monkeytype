const tempIdPrefix = "temp_";

export function tempId(): string {
  return `${tempIdPrefix}${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

export function isTempId(id: string): boolean {
  return id.startsWith(tempIdPrefix);
}

/**
 * Never garbage collect user data. Spread into both `queryCollectionOptions`
 * (query cache gcTime: dropping the query deletes its rows from the
 * collection) and `createCollection` (collection gcTime: not passed through by
 * `queryCollectionOptions`). User data is small, needed all session and
 * cleared on sign out, so GC would only cause refetches or, for non-reactive
 * readers like the commandline, an empty list.
 */
export const keepForever = { gcTime: Infinity } as const;
