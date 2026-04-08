import { MaxLineWidthSchema } from "@monkeytype/schemas/configs";
import { createForm } from "@tanstack/solid-form";
import { createSignal, JSXElement } from "solid-js";

import { configMetadata } from "../../../../config/metadata";
import { setConfig } from "../../../../config/setters";
import { getConfig } from "../../../../config/store";
import { AnimeShow } from "../../../common/anime";
// import { showSuccessNotification } from "../../../../states/notifications";
import { Fa } from "../../../common/Fa";
import { InputField } from "../../../ui/form/InputField";
import { fromSchema } from "../../../ui/form/utils";
import { Setting } from "../Setting";

export function MaxLineWidth(): JSXElement {
  const [showSavedIndicator, setShowSavedIndicator] = createSignal(false);

  const form = createForm(() => ({
    defaultValues: {
      maxLineWidth: getConfig.maxLineWidth,
    },
    onSubmit: ({ value }) => {
      const val = parseInt(String(value.maxLineWidth));
      if (val === getConfig.maxLineWidth) return;
      setShowSavedIndicator(true);
      setTimeout(() => {
        setShowSavedIndicator(false);
      }, 2000);
      setConfig("maxLineWidth", val);
    },
  }));

  return (
    <Setting
      title={configMetadata.maxLineWidth.displayString ?? "max line width"}
      fa={configMetadata.maxLineWidth.fa}
      description={configMetadata.maxLineWidth.description}
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
              name="maxLineWidth"
              validators={{
                onChange: ({ value }) => {
                  const val = parseInt(String(value));
                  if (isNaN(val)) {
                    return "Must be a number";
                  }
                  return fromSchema(MaxLineWidthSchema)({
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
                      configMetadata.maxLineWidth.displayString ??
                      "max line width"
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
        </div>
      }
    />
  );
}
