import { animate } from "animejs";
import { applyReducedMotion } from "../utils/misc";

export function hide(): void {
  visible = false;
  const crown = document.querySelector("#result .stats .wpm .crown") as HTMLElement | null;
  if (crown) {
    crown.style.opacity = "0";
    crown.classList.add("hidden");
  }
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
  const el = document.querySelector(
    "#result .stats .wpm .crown",
  ) as HTMLElement;

  animate(el, {
    opacity: [0, 1],
    duration: applyReducedMotion(125),
    onBegin: () => {
      el.classList.remove("hidden");
    },
  });
}

export function update(type: CrownType): void {
  currentType = type;
  const crown = document.querySelector("#result .stats .wpm .crown");
  if (crown) {
    crown.classList.remove("ineligible", "pending", "error", "warning");
    crown.classList.add(type);
  }
}
