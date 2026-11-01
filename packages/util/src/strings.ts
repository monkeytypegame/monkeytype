export function kebabToCamelCase(kebab: string): string {
  return kebab.replace(/-([a-z])/g, (_, char: string) => char.toUpperCase());
}

export function sanitizeString(str: string | undefined): string | undefined {
  if (str === undefined || str === "") {
    return str;
  }

  return str
    .replace(/[\u0300-\u036F]/g, "")
    .trim()
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[^\S\r\n]{3,}/g, "  ");
}
