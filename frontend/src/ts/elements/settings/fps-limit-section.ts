import { getfpsLimit, fpsLimitSchema, setfpsLimit } from "../../anim";
import { qs } from "../../utils/dom";
import { validateWithIndicator } from "../input-validation";
import * as Notifications from "../notifications";

const section = qs("#pageSettings .section.fpsLimit", { guaranteed: true });

const button = section?.qs("button[data-fpsLimit='native']");

const input = validateWithIndicator(
  section.qs('input[type="number"]', { guaranteed: true }),
  {
    schema: fpsLimitSchema,
    inputValueConvert: (val: string) => parseInt(val, 10),
  }
);

export function update(): void {
  const fpsLimit = getfpsLimit();
  if (fpsLimit >= 1000) {
    input.setValueAndDispatchEvent(null);
    button?.addClass("active");
  } else {
    input.setValueAndDispatchEvent(fpsLimit.toString());
    button?.removeClass("active");
  }
}

function save(value: number): void {
  if (setfpsLimit(value)) {
    Notifications.add("FPS limit updated", 0);
  }
  update();
}

function saveFromInput(): void {
  if (input.getValidationResult().status !== "success") return;
  const val = parseInt(input.getValue(), 10);
  save(val);
}

button?.on("click", () => {
  save(1000);
  update();
});

input?.on("keypress", (e) => {
  if (e.key === "Enter") {
    saveFromInput();
  }
});

input?.on("focusout", (e) => saveFromInput());
