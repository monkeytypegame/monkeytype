import { JSXElement } from "solid-js";

import { applyConfigFromJson } from "../../../../config/lifecycle";
import { getConfig } from "../../../../config/store";
import {
  showNoticeNotification,
  showSuccessNotification,
} from "../../../../states/notifications";
import { showSimpleModal } from "../../../../states/simple-modal";
import { Button } from "../../../common/Button";
import { Setting } from "../Setting";

export function ImportExport(): JSXElement {
  return (
    <Setting
      title="import/export settings"
      description="Import or export the settings as JSON."
      fa={{
        icon: "fa-sliders-h",
      }}
      inputs={
        <div class="grid grid-cols-2 gap-2">
          <Button
            onClick={() => {
              showSimpleModal({
                title: "import settings",
                class: "min-w-2xl",
                inputs: [
                  {
                    type: "text",
                  },
                ],
                buttonText: "import",
                execFn: async (json) => {
                  try {
                    void applyConfigFromJson(json);
                  } catch (e) {}
                  return {
                    status: "success",
                    message: "Import",
                    showNotification: false,
                  };
                },
              });
            }}
          >
            import
          </Button>
          <Button
            onClick={() => {
              navigator.clipboard
                .writeText(JSON.stringify(getConfig))
                .then(() => {
                  showSuccessNotification("Settings JSON copied to clipboard");
                })
                .catch(() => {
                  showNoticeNotification(
                    "Looks like we couldn't copy the config straight to your clipboard. Please copy it manually.",
                    {
                      durationMs: 5000,
                    },
                  );

                  setTimeout(() => {
                    showSimpleModal({
                      title: "Config JSON",
                      class: "max-w-2xl",
                      inputs: [
                        {
                          type: "textarea",
                          placeholder: "Config JSON",
                          initVal: JSON.stringify(getConfig),
                          clickToSelect: true,
                          readOnly: true,
                          class: "h-50",
                        },
                      ],
                      execFn: async () => {
                        return {
                          status: "success",
                          message: "Copied",
                          showNotification: false,
                        };
                      },
                    });
                  }, 250);
                  // this is flaky, no chaining for simple modals
                });
            }}
          >
            export
          </Button>
        </div>
      }
    />
  );
}
