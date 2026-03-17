export function baseKey(
  key: string,
  options?: { isUserSpecific?: true },
): unknown[] {
  return options?.isUserSpecific ? ["user", key] : [key];
}
