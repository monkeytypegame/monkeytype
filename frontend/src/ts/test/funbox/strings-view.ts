export function strView(
  arr: string[],
  start: number,
  end: number = arr.length,
): string[] {
  const s = Math.max(0, start);
  const e = Math.min(arr.length, end);
  /**
   * Creates a lightweight view (reference slice) into an existing array without copying data.
   *
   * This function returns a Proxy that acts as a window into a portion of the original array.
   * Unlike Array.slice() which creates a new array with copied elements, this function
   * maintains a live reference to the original data, enabling bidirectional synchronization.
   */
  return new Proxy(arr, {
    get(target, prop) {
      if (prop === "length") return e - s;

      const i = Number(prop);
      if (Number.isInteger(i) && i >= 0 && i < e - s) {
        return target[s + i];
      }
      return undefined;
    },

    set(target, prop, value: string) {
      const i = Number(prop);
      if (Number.isInteger(i) && i >= 0 && i < e - s) {
        target[s + i] = value;
        return true;
      }
      return false;
    },
  });
}
