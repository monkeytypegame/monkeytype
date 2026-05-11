import { JSXElement, For } from "solid-js";

import {
  deletePreset,
  usePresetsLiveQuery,
} from "../../../../collections/presets";
import { apply } from "../../../../controllers/preset-controller";
import { hideLoaderBar, showLoaderBar } from "../../../../states/loader-bar";
import { showSimpleModal } from "../../../../states/simple-modal";
import { Button } from "../../../common/Button";
import { Setting } from "../Setting";

export function Presets(): JSXElement {
  const presets = usePresetsLiveQuery();

  return (
    <Setting
      key="presets"
      title="presets"
      description="Create settings presets that can be applied with one click. Remember to edit your preset if you make any changes - they don't save on their own."
      fa={{
        icon: "fa-sliders-h",
      }}
      inputs={
        <div class="grid gap-2">
          <For each={presets()}>
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
                    // todo: implement
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
                      textClass: "text-text",
                      execFn: async () => {
                        showLoaderBar();
                        await deletePreset({ presetId: preset._id });
                        hideLoaderBar();
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
              // todo: implement
            }}
          />
        </div>
      }
    />
  );
}
