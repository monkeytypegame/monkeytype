import { MinimumBurstCustomSpeedSchema } from "@monkeytype/schemas/configs";
import { createForm } from "@tanstack/solid-form";
import { JSXElement } from "solid-js";

import { configMetadata } from "../../../../config/metadata";
import { setConfig } from "../../../../config/setters";
import { getConfig } from "../../../../config/store";
import { useSavedIndicator } from "../../../../hooks/useSavedIndicator";
// import { showSuccessNotification } from "../../../../states/notifications";
import { Button } from "../../../common/Button";
import { InputField } from "../../../ui/form/InputField";
import { fromSchema } from "../../../ui/form/utils";
import { Setting } from "../Setting";

export function MinBurst(): JSXElement {
  const savedIndicator = useSavedIndicator();

  const form = createForm(() => ({
    defaultValues: {
      minBurstCustomSpeed: getConfig.minBurstCustomSpeed,
    },
    onSubmit: ({ value }) => {
      const val = parseInt(String(value.minBurstCustomSpeed));
      if (val === getConfig.minBurstCustomSpeed) return;
      if (getConfig.minBurst !== "off") {
        //
      } else {
        setConfig("minBurst", "fixed");
      }
      savedIndicator.flash();
      setConfig("minBurstCustomSpeed", val);
    },
  }));

  return (
    <Setting
      key="minBurst"
      title={configMetadata.minBurst.displayString ?? "min burst"}
      fa={configMetadata.minBurst.fa}
      description={configMetadata.minBurst.description}
      inputs={
        <div class="grid w-full gap-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void form.handleSubmit();
            }}
          >
            <form.Field
              name="minBurstCustomSpeed"
              validators={{
                onChange: ({ value }) => {
                  const val = parseInt(String(value));
                  if (isNaN(val)) {
                    return "Must be a number";
                  }
                  return fromSchema(MinimumBurstCustomSpeedSchema)({
                    value: val,
                  });
                },
                onBlur: () => {
                  void form.handleSubmit();
                },
              }}
              children={(field) => (
                <div class="relative">
                  <InputField
                    field={field}
                    placeholder={
                      configMetadata.minBurst.displayString ?? "min burst"
                    }
                    type="number"
                    resetToDefaultIfEmptyOnBlur
                  />
                  <savedIndicator.component />
                </div>
              )}
            />
          </form>
          {/* <input class="w-full" value={inputValue()} /> */}
          <div class="grid grid-cols-3 gap-2">
            <Button
              active={getConfig.minBurst === "off"}
              onClick={() => {
                if (getConfig.minBurst === "off") return;
                setConfig("minBurst", "off");
              }}
            >
              off
            </Button>
            <Button
              active={getConfig.minBurst === "fixed"}
              onClick={() => {
                if (getConfig.minBurst === "fixed") return;
                setConfig("minBurst", "fixed");
              }}
            >
              fixed
            </Button>
            <Button
              active={getConfig.minBurst === "flex"}
              onClick={() => {
                if (getConfig.minBurst === "flex") return;
                setConfig("minBurst", "flex");
              }}
            >
              flex
            </Button>
          </div>
        </div>
      }
    />
  );
}
