const tempIdPrefix = "temp_";

export function tempId(): string {
  return `${tempIdPrefix}${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

export function isTempId(id: string): boolean {
  return id.startsWith(tempIdPrefix);
}
