import { TapeMarginSchema } from "@monkeytype/schemas/configs";
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

export function TapeMargin(): JSXElement {
  const [showSavedIndicator, setShowSavedIndicator] = createSignal(false);

  const form = createForm(() => ({
    defaultValues: {
      tapeMargin: getConfig.tapeMargin,
    },
    onSubmit: ({ value }) => {
      const val = parseInt(String(value.tapeMargin));
      if (val === getConfig.tapeMargin) return;
      setShowSavedIndicator(true);
      setTimeout(() => {
        setShowSavedIndicator(false);
      }, 2000);
      setConfig("tapeMargin", val);
    },
  }));

  return (
    <Setting
      title={configMetadata.tapeMargin.displayString ?? "tape margin"}
      fa={configMetadata.tapeMargin.fa}
      description={configMetadata.tapeMargin.description}
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
              name="tapeMargin"
              validators={{
                onChange: ({ value }) => {
                  const val = parseInt(String(value));
                  if (isNaN(val)) {
                    return "Must be a number";
                  }
                  return fromSchema(TapeMarginSchema)({
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
                      configMetadata.tapeMargin.displayString ?? "tape margin"
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
