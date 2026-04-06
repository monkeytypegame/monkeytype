import { MinimumAccuracyCustomSchema } from "@monkeytype/schemas/configs";
import { createForm } from "@tanstack/solid-form";
import { createSignal, JSXElement } from "solid-js";

import { configMetadata } from "../../../../config/metadata";
import { setConfig } from "../../../../config/setters";
import { getConfig } from "../../../../config/store";
import { AnimeShow } from "../../../common/anime";
// import { showSuccessNotification } from "../../../../states/notifications";
import { Button } from "../../../common/Button";
import { Fa } from "../../../common/Fa";
import { InputField } from "../../../ui/form/InputField";
import { fromSchema } from "../../../ui/form/utils";
import { Setting } from "../Setting";

export function MinAcc(): JSXElement {
  const [showSavedIndicator, setShowSavedIndicator] = createSignal(false);

  const form = createForm(() => ({
    defaultValues: {
      minAccCustom: getConfig.minAccCustom,
    },
    onSubmit: ({ value }) => {
      const val = parseInt(String(value.minAccCustom));
      if (val === getConfig.minAccCustom) return;
      if (getConfig.minAcc === "custom") {
        //
      } else {
        setConfig("minAcc", "custom");
      }
      // showSuccessNotification("Min accuracy saved", {
      //   durationMs: 1000,
      // });
      setShowSavedIndicator(true);
      setTimeout(() => {
        setShowSavedIndicator(false);
      }, 2000);
      setConfig("minAccCustom", val);
    },
  }));

  return (
    <Setting
      title={configMetadata.minAcc.displayString ?? "min accuracy"}
      fa={configMetadata.minAcc.fa}
      description={configMetadata.minAcc.description}
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
              name="minAccCustom"
              validators={{
                onChange: ({ value }) => {
                  const val = parseInt(String(value));
                  if (isNaN(val)) {
                    return "must be a number";
                  }
                  return fromSchema(MinimumAccuracyCustomSchema)({
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
                      configMetadata.minAcc.displayString ?? "min accuracy"
                    }
                    showIndicator
                    type="number"
                  />
                  <AnimeShow when={showSavedIndicator()}>
                    <div class="absolute top-0 right-0 rounded bg-sub-alt p-[0.5em] text-main">
                      <Fa icon="fa-save" fixedWidth />
                    </div>
                  </AnimeShow>
                </div>
              )}
            />
          </form>
          {/* <input class="w-full" value={inputValue()} /> */}
          <div class="grid grid-cols-2 gap-2">
            <Button
              active={getConfig.minAcc === "off"}
              onClick={() => {
                if (getConfig.minAcc === "off") return;
                setConfig("minAcc", "off");
              }}
            >
              off
            </Button>
            <Button
              active={getConfig.minAcc === "custom"}
              onClick={() => {
                if (getConfig.minAcc === "custom") return;
                setConfig("minAcc", "custom");
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
