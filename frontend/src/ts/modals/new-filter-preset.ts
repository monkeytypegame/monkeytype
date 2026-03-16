import { ResultFiltersSchema } from "@monkeytype/schemas/users";
import { createFilterPreset } from "../elements/account/result-filters";
import { SimpleModal } from "../elements/simple-modal";

export function show(): void {
  newFilterPresetModal.show(undefined, {});
}

const newFilterPresetModal = new SimpleModal({
  id: "newFilterPresetModal",
  title: "New Filter Preset",
  inputs: [
    {
      placeholder: "Preset Name",
      type: "text",
      initVal: "",
      validation: {
        schema: ResultFiltersSchema.shape.name,
      },
    },
  ],
  buttonText: "add",
  execFn: async (_thisPopup, name) => {
    const status = await createFilterPreset(name);

    if (status === 1) {
      return { status: "success", message: "Filter preset created" };
    } else {
      let status: "error" | "notice" | "success" = "error";
      let message: string = "Error creating filter preset";
      return { status, message, alwaysHide: true };
    }
  },
});
