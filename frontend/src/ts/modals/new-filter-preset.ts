import { createFilterPreset } from "../elements/account/result-filters";
import AnimatedModal, { ShowOptions } from "../utils/animated-modal";
import * as Notifications from "../elements/notifications";
import { InputIndicator } from "../elements/input-indicator";
import { ResultFiltersSchema } from "@monkeytype/schemas/users";

export function show(showOptions?: ShowOptions): void {
  void modal.show({
    ...showOptions,
    focusFirstInput: true,
    beforeAnimation: async (modalEl) => {
      (modalEl.querySelector("input") as HTMLInputElement).value = "";

      const indicator = $(modalEl).data("indicator") as
        | InputIndicator
        | undefined;
      if (indicator) {
        indicator.hide();
      }
    },
  });
}

function hide(clearChain = false): void {
  void modal.hide({
    clearModalChain: clearChain,
  });
}

function apply(): void {
  const name = $("#newFilterPresetModal input").val() as string;
  if (name === "") {
    Notifications.add("Name cannot be empty", 0);
    return;
  }
  void createFilterPreset(name);
  hide(true);
}

function addValidation(element: JQuery, schema: Zod.Schema): InputIndicator {
  const indicator = new InputIndicator(element, {
    valid: { icon: "fa-check", level: 1 },
    invalid: { icon: "fa-times", level: -1 },
  });

  element.on("input", (event) => {
    const value = (event.target as HTMLInputElement).value;
    if (value === undefined || value === "") {
      indicator.hide();
      return;
    }
    const validationResult = schema.safeParse(value);
    if (!validationResult.success) {
      indicator.show(
        "invalid",
        validationResult.error.errors.map((err) => err.message).join(", ")
      );
      return;
    }
    indicator.show("valid");
  });
  return indicator;
}

async function setup(modalEl: HTMLElement): Promise<void> {
  modalEl.addEventListener("submit", (e) => {
    e.preventDefault();
    apply();
  });

  const inputElement = $(modalEl).find("input");

  const indicator = addValidation(inputElement, ResultFiltersSchema.shape.name);
  $(modalEl).data("indicator", indicator);
}

const modal = new AnimatedModal({
  dialogId: "newFilterPresetModal",
  setup,
});
