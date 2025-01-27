import { PartialConfigSchema } from "@monkeytype/contracts/schemas/configs";
import * as UpdateConfig from "../config";
import * as Notifications from "../elements/notifications";
import AnimatedModal from "../utils/animated-modal";
import { migrateConfig } from "../utils/config";
import { parseWithSchema as parseJsonWithSchema } from "@monkeytype/util/json";

type State = {
  mode: "import" | "export";
  value: string;
};

const state: State = {
  mode: "import",
  value: "",
};

export function show(mode: "import" | "export", config?: string): void {
  state.mode = mode;
  state.value = config ?? "";

  void modal.show({
    focusFirstInput: "focusAndSelect",
    beforeAnimation: async (modal) => {
      (modal.querySelector("input") as HTMLInputElement).value = state.value;
      if (state.mode === "export") {
        modal.querySelector("button")?.classList.add("hidden");
        modal.querySelector("input")?.setAttribute("readonly", "true");
      } else if (state.mode === "import") {
        modal.querySelector("button")?.classList.remove("hidden");
        modal.querySelector("input")?.removeAttribute("readonly");
      }
    },
  });
}

const modal = new AnimatedModal({
  dialogId: "importExportSettingsModal",
  setup: async (modalEl): Promise<void> => {
    modalEl.querySelector("input")?.addEventListener("input", (e) => {
      state.value = (e.target as HTMLInputElement).value;
    });
    modalEl?.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (state.mode !== "import") return;
      if (state.value === "") {
        void modal.hide();
        return;
      }
      try {
        const parsedConfig = parseJsonWithSchema(
          state.value,
          PartialConfigSchema.strip()
        );
        await UpdateConfig.apply(migrateConfig(parsedConfig));
      } catch (e) {
        Notifications.add(
          "Failed to import settings: incorrect data schema",
          0
        );
        console.error(e);
        void modal.hide();
        return;
      }
      Notifications.add("Settings imported", 1);
      UpdateConfig.saveFullConfigToLocalStorage();
      void modal.hide();
    });
  },
});
