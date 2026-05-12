export function tempId(): string {
  return (
    "temp_" + Math.random().toString(36).slice(2) + Date.now().toString(36)
  );
}

/**
 * temp. workaround for  https://github.com/TanStack/db/issues/1524
 */
export function applyIdWorkaround<T extends { _id: string }>(item: T): T {
  //@ts-expect-error this is fine
  item.id = item._id;
  return item;
}
