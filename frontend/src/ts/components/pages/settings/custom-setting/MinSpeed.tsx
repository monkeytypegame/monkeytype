import { MinWpmCustomSpeedSchema } from "@monkeytype/schemas/configs";
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

export function MinSpeed(): JSXElement {
  const savedIndicator = useSavedIndicator();

  const form = createForm(() => ({
    defaultValues: {
      minWpmCustomSpeed: getConfig.minWpmCustomSpeed,
    },
    onSubmit: ({ value }) => {
      const val = parseInt(String(value.minWpmCustomSpeed));
      if (val === getConfig.minWpmCustomSpeed) return;
      if (getConfig.minWpm === "custom") {
        //
      } else {
        setConfig("minWpm", "custom");
      }
      savedIndicator.flash();
      setConfig("minWpmCustomSpeed", val);
    },
  }));

  return (
    <Setting
      key="minSpeed"
      title={configMetadata.minWpm.displayString ?? "min speed"}
      fa={configMetadata.minWpm.fa}
      description={configMetadata.minWpm.description}
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
              name="minWpmCustomSpeed"
              validators={{
                onChange: ({ value }) => {
                  const val = parseInt(String(value));
                  if (isNaN(val)) {
                    return "Must be a number";
                  }
                  return fromSchema(MinWpmCustomSpeedSchema)({ value: val });
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
                      configMetadata.minWpm.displayString ?? "min speed"
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
          <div class="grid grid-cols-2 gap-2">
            <Button
              active={getConfig.minWpm === "off"}
              onClick={() => {
                if (getConfig.minWpm === "off") return;
                setConfig("minWpm", "off");
              }}
            >
              off
            </Button>
            <Button
              active={getConfig.minWpm === "custom"}
              onClick={() => {
                if (getConfig.minWpm === "custom") return;
                setConfig("minWpm", "custom");
              }}
            >
              custom
            </Button>
          </div>
        </div>
      }
    />
  );
}
