import { For, JSXElement } from "solid-js";

import { apply } from "../../../../controllers/preset-controller";
import { deletePreset, getPresets } from "../../../../queries/presets";
import { showEditPresetModal } from "../../../../states/edit-preset-modal";
import { showModal } from "../../../../states/modals";
import { showSimpleModal } from "../../../../states/simple-modal";
import { Button } from "../../../common/Button";
import { SearchableSetting } from "../SearchableSetting";

export function Presets(): JSXElement {
  return (
    <SearchableSetting
      key="presets"
      title="presets"
      description="Create settings presets that can be applied with one click. Remember to edit your preset if you make any changes - they don't save on their own."
      fa={{
        icon: "fa-sliders-h",
      }}
      inputs={
        <div class="grid gap-2">
          <For each={getPresets()}>
            {(preset) => (
              <div class="grid grid-cols-[1fr_auto_auto] gap-2">
                <Button
                  text={preset.name}
                  onClick={() => {
                    void apply(preset._id);
                  }}
                />
                <Button
                  fa={{
                    icon: "fa-pen",
                  }}
                  onClick={() => {
                    showEditPresetModal({
                      presetId: preset._id,
                      name: preset.name,
                    });
                  }}
                />
                <Button
                  fa={{
                    icon: "fa-trash",
                  }}
                  onClick={() => {
                    showSimpleModal({
                      title: "Delete preset",
                      text: `Are you sure you want to delete preset "${preset.name}"? This action cannot be undone.`,
                      buttonText: "delete",
                      execFn: async () => {
                        const { error } = await deletePreset({
                          presetId: preset._id,
                        });
                        if (error !== null) {
                          return {
                            status: "error",
                            message: "Failed to delete preset",
                            notificationOptions: { error },
                          };
                        }

                        return {
                          status: "success",
                          message: "Preset deleted",
                        };
                      },
                    });
                  }}
                />
              </div>
            )}
          </For>
          <Button
            text="add preset"
            onClick={() => {
              showModal("AddPresetModal");
            }}
          />
        </div>
      }
    />
  );
}
