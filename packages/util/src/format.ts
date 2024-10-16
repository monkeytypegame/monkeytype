export function rank(
  position: number | null | undefined,
  formatOptions: {
    fallback?: string;
  } = {}
): string {
  const options = { fallback: "-", ...formatOptions };

  if (position === undefined || position === null)
    return options.fallback ?? "";
  let numend = "th";
  const t = position % 10;
  const h = position % 100;
  if (t === 1 && h !== 11) {
    numend = "st";
  }
  if (t === 2 && h !== 12) {
    numend = "nd";
  }
  if (t === 3 && h !== 13) {
    numend = "rd";
  }
  return position + numend;
}
