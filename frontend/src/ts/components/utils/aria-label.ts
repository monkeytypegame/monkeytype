export type AriaLabel =
  | string
  | { text: string; position: "up" | "down" | "left" | "right" };

export function ariaLabel(ariaLabel?: AriaLabel):
  | {
      "aria-label": string;
      "data-balloon-pos": string;
    }
  | undefined {
  if (ariaLabel === undefined) return undefined;
  if (typeof ariaLabel === "string") {
    return { "aria-label": ariaLabel, "data-balloon-pos": "up" };
  }
  return {
    "aria-label": ariaLabel.text,
    "data-balloon-pos": ariaLabel.position,
  };
}
