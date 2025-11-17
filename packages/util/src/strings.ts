export function kebabToCamelCase(kebab: string): string {
  return kebab.replace(/-([a-z])/g, (_, char: string) => char.toUpperCase());
}
