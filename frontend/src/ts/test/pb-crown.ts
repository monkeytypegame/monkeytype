import { applyReducedMotion } from "../utils/misc";
import { qs } from "../utils/dom";

export function hide(): void {
  visible = false;
  qs("#result .stats .wpm .crown")?.setStyle({ opacity: "0" })?.hide();
}

export type CrownType =
  | "normal"
  | "ineligible"
  | "pending"
  | "error"
  | "warning";

let visible = false;
let currentType: CrownType = "normal";

export function getCurrentType(): CrownType {
  return currentType;
}

export function show(): void {
  if (visible) return;
  visible = true;
  const el = qs("#result .stats .wpm .crown");

  el?.animate({
    opacity: [0, 1],
    duration: applyReducedMotion(125),
    onBegin: () => {
      el?.show();
    },
  });
}

export function update(type: CrownType): void {
  currentType = type;
  qs("#result .stats .wpm .crown")
    ?.removeClass("ineligible")
    ?.removeClass("pending")
    ?.removeClass("error")
    ?.removeClass("warning")
    ?.addClass(type);
}
