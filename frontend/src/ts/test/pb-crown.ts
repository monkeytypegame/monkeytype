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
  const el = $("#result .stats .wpm .crown");
  el.removeClass("hidden").css("opacity", "0").animate(
    {
      opacity: 1,
    },
    250,
    "easeOutCubic"
  );
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
