import {
  ConfigSchema,
  PaceCaretCustomSpeedSchema,
} from "@monkeytype/schemas/configs";
import { createForm } from "@tanstack/solid-form";
import { createSignal, For, JSXElement } from "solid-js";

import { configMetadata } from "../../../../config/metadata";
import { setConfig } from "../../../../config/setters";
import { getConfig } from "../../../../config/store";
import { getOptions } from "../../../../utils/zod";
import { AnimeShow } from "../../../common/anime";
import { Button } from "../../../common/Button";
import { Fa } from "../../../common/Fa";
import { InputField } from "../../../ui/form/InputField";
import { fromSchema } from "../../../ui/form/utils";
import { Setting } from "../Setting";

export function PaceCaret(): JSXElement {
  const [showSavedIndicator, setShowSavedIndicator] = createSignal(false);

  const form = createForm(() => ({
    defaultValues: {
      paceCaretCustomSpeed: getConfig.paceCaretCustomSpeed,
    },
    onSubmit: ({ value }) => {
      const val = parseInt(String(value.paceCaretCustomSpeed));
      if (val === getConfig.paceCaretCustomSpeed) return;
      if (getConfig.paceCaret !== "off") {
        //
      } else {
        setConfig("paceCaret", "custom");
      }
      setShowSavedIndicator(true);
      setTimeout(() => {
        setShowSavedIndicator(false);
      }, 2000);
      setConfig("paceCaretCustomSpeed", val);
    },
  }));

  return (
    <Setting
      title={configMetadata.paceCaret.displayString ?? "pace caret"}
      fa={configMetadata.paceCaret.fa}
      description={configMetadata.paceCaret.description}
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
              name="paceCaretCustomSpeed"
              validators={{
                onChange: ({ value }) => {
                  const val = parseInt(String(value));
                  if (isNaN(val)) {
                    return "Must be a number";
                  }
                  return fromSchema(PaceCaretCustomSpeedSchema)({
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
                    placeholder={"pace caret speed"}
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
          <div class="grid grid-cols-[repeat(auto-fit,minmax(6rem,1fr))] gap-2">
            <For each={getOptions(ConfigSchema.shape.paceCaret)}>
              {(option) => {
                const optionMeta = configMetadata.paceCaret
                  .optionsMetadata as Record<
                  string,
                  { displayString?: string }
                >;
                const displayString =
                  optionMeta?.[String(option)]?.displayString ?? String(option);
                return (
                  <Button
                    active={getConfig.paceCaret === option}
                    onClick={() => {
                      if (getConfig.paceCaret === option) return;
                      setConfig("paceCaret", option);
                    }}
                  >
                    {displayString}
                  </Button>
                );
              }}
            </For>
          </div>
        </div>
      }
    />
  );
}
