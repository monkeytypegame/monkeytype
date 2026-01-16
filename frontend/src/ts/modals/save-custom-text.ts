import * as CustomText from "../test/custom-text";
import * as Notifications from "../elements/notifications";
import * as CustomTextState from "../states/custom-text-name";
import AnimatedModal, { ShowOptions } from "../utils/animated-modal";
import { ValidatedHtmlInputElement } from "../elements/input-validation";
import { z } from "zod";
import { ElementWithUtils, qsr } from "../utils/dom";

type IncomingData = {
  text: string[];
};

type State = {
  textToSave: string[];
};

const state: State = {
  textToSave: [],
};

const validatedInput = new ValidatedHtmlInputElement(
  qsr("#saveCustomTextModal .textName"),
  {
    debounceDelay: 500,
    schema: z
      .string()
      .min(1)
      .max(32)
      .regex(/^[\w\s-]+$/, {
        message:
          "Name can only contain letters, numbers, spaces, underscores and hyphens",
      }),
    isValid: async (value) => {
      const checkbox = modal
        .getModal()
        .qsr<HTMLInputElement>(".isLongText")
        .isChecked() as boolean;
      const names = CustomText.getCustomTextNames(checkbox);
      return !names.includes(value) ? true : "Duplicate name";
    },
    callback: (result) => {
      const modalEl = modal.getModal();
      if (result.status === "success") {
        modalEl.qsr("button.save").enable();
      } else {
        modalEl.qsr("button.save").disable();
      }
    },
  },
);

export async function show(options: ShowOptions<IncomingData>): Promise<void> {
  state.textToSave = [];
  void modal.show({
    ...options,
    beforeAnimation: async (modalEl, modalChainData) => {
      state.textToSave = modalChainData?.text ?? [];
      modalEl.qsr<HTMLInputElement>(".textName").setValue("");
      modalEl.qsr<HTMLInputElement>(".isLongText").setChecked(false);
      modalEl.qsr("button.save").disable();
    },
  });
}

function save(): boolean {
  const modalEl = modal.getModal();
  const name = modalEl.qsr<HTMLInputElement>(".textName").getValue() as string;
  const checkbox = modalEl
    .qsr<HTMLInputElement>(".isLongText")
    .isChecked() as boolean;

  if (!name) {
    Notifications.add("Custom text needs a name", 0);
    return false;
  }

  if (state.textToSave.length === 0) {
    Notifications.add("Custom text can't be empty", 0);
    return false;
  }

  const saved = CustomText.setCustomText(name, state.textToSave, checkbox);
  if (saved) {
    CustomTextState.setCustomTextName(name, checkbox);
    Notifications.add("Custom text saved", 1);
    return true;
  } else {
    Notifications.add("Error saving custom text", -1);
    return false;
  }
}

async function setup(modalEl: ElementWithUtils): Promise<void> {
  modalEl.on("submit", (e) => {
    e.preventDefault();
    if (validatedInput.getValidationResult().status === "success" && save()) {
      void modal.hide();
    }
  });
  modalEl.qs(".isLongText")?.on("input", (e) => {
    validatedInput.triggerValidation();
  });
}

const modal = new AnimatedModal<IncomingData>({
  dialogId: "saveCustomTextModal",
  setup,
});
