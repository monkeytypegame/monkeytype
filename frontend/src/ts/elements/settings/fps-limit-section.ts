import { getfpsLimit, fpsLimitSchema, setfpsLimit } from "../../anim";
import { validateWithIndicator } from "../input-validation";
import * as Notifications from "../notifications";

const section = document.querySelector(
  "#pageSettings .section.fpsLimit"
) as HTMLElement;

const button = section.querySelector(
  "button[data-fpsLimit='native']"
) as HTMLButtonElement;

const input = validateWithIndicator(
  section.querySelector('input[type="number"]') as HTMLInputElement,
  {
    schema: fpsLimitSchema,
    inputValueConvert: (val: string) => parseInt(val, 10),
  }
);

export function update(): void {
  const fpsLimit = getfpsLimit();
  if (fpsLimit >= 1000) {
    input.setValue(null);
    button.classList.add("active");
  } else {
    input.value = fpsLimit.toString();
    button.classList.remove("active");
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
  const val = parseInt(input.value, 10);
  save(val);
}

button.addEventListener("click", () => {
  save(1000);
  update();
});

input.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    saveFromInput();
  }
});

input.addEventListener("focusout", (e) => saveFromInput());
