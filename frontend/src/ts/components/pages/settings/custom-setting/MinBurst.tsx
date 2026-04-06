import { MinimumBurstCustomSpeedSchema } from "@monkeytype/schemas/configs";
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

export function MinBurst(): JSXElement {
  const [showSavedIndicator, setShowSavedIndicator] = createSignal(false);

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
      // showSuccessNotification("Min burst saved", {
      //   durationMs: 1000,
      // });
      setShowSavedIndicator(true);
      setTimeout(() => {
        setShowSavedIndicator(false);
      }, 2000);
      setConfig("minBurstCustomSpeed", val);
    },
  }));

  return (
    <Setting
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
                    return "must be a number";
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
