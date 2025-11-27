import { animate } from "animejs";
import { applyReducedMotion } from "../utils/misc";

export function hide(): void {
  visible = false;
  $("#result .stats .wpm .crown").css("opacity", 0).addClass("hidden");
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
  const el = $("#result .stats .wpm .crown");
  el.removeClass("ineligible");
  el.removeClass("pending");
  el.removeClass("error");
  el.removeClass("warning");
  el.addClass(type);
}
