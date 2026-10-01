export function typedKeys<T extends object>(
  obj: T,
): T extends T ? (keyof T)[] : never {
  return Object.keys(obj) as unknown as T extends T ? (keyof T)[] : never;
}

export function typedEntries<T extends object>(
  obj: T,
): { [K in keyof T]: [K, T[K]] }[keyof T][] {
  return Object.entries(obj) as { [K in keyof T]: [K, T[K]] }[keyof T][];
}

export function typedValues<T extends object>(obj: T): T[keyof T][] {
  return Object.values(obj) as T[keyof T][];
}
