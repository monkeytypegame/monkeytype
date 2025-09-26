export function addToGlobal(items: Record<string, unknown>): void {
  for (const [name, item] of Object.entries(items)) {
    //@ts-expect-error dev
    window[name] = item;
  }
}
