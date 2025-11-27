import { getfpsLimit, fpsLimitSchema, setfpsLimit } from "../../anim";
import { qsr } from "../../utils/dom";
import { ValidatedHtmlInputElement } from "../input-validation";
import * as Notifications from "../notifications";

const section = qsr("#pageSettings .section.fpsLimit");

const button = section?.qs("button[data-fpsLimit='native']");

const input = new ValidatedHtmlInputElement(
  section.qsr('input[type="number"]'),
  {
    schema: fpsLimitSchema,
    inputValueConvert: (val: string) => parseInt(val, 10),
  },
);

export function update(): void {
  const fpsLimit = getfpsLimit();
  if (fpsLimit >= 1000) {
    input.setValue(null);
    button?.addClass("active");
  } else {
    input.setValue(fpsLimit.toString());
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

input.element.on("keypress", (e) => {
  if (e.key === "Enter") {
    saveFromInput();
  }
});

input.element.on("focusout", (e) => saveFromInput());
