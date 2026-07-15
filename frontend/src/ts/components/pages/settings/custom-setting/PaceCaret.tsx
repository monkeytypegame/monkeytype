import {
  ConfigSchema,
  PaceCaretCustomSpeedSchema,
} from "@monkeytype/schemas/configs";
import { createForm } from "@tanstack/solid-form";
import { useQuery } from "@tanstack/solid-query";
import { For, JSXElement } from "solid-js";

import {
  configMetadata,
  getOptionLabel,
  getOptionSearchKeywords,
} from "../../../../config/metadata";
import {
  getPaceCaretContext,
  isPaceCaretModeAvailable,
} from "../../../../config/pace-caret-options";
import { setConfig } from "../../../../config/setters";
import { getConfig } from "../../../../config/store";
import { useSavedIndicator } from "../../../../hooks/useSavedIndicator";
import { getServerConfigurationQueryOptions } from "../../../../queries/server-configuration";
import { getOptions } from "../../../../utils/zod";
import { Button } from "../../../common/Button";
import { InputField } from "../../../ui/form/InputField";
import { fromSchema } from "../../../ui/form/utils";
import { SearchableSetting } from "../SearchableSetting";

export function PaceCaret(): JSXElement {
  const savedIndicator = useSavedIndicator();
  const serverConfiguration = useQuery(() =>
    getServerConfigurationQueryOptions(),
  );

  const form = createForm(() => ({
    defaultValues: {
      paceCaretCustomSpeed: getConfig.paceCaretCustomSpeed,
    },
    onSubmit: ({ value }) => {
      const val = value.paceCaretCustomSpeed;
      if (val === getConfig.paceCaretCustomSpeed) return;
      if (getConfig.paceCaret !== "off") {
        //
      } else {
        setConfig("paceCaret", "custom");
      }
      savedIndicator.flash();
      setConfig("paceCaretCustomSpeed", val);
    },
  }));

  return (
    <SearchableSetting
      key="paceCaret"
      title={configMetadata.paceCaret.displayString ?? "pace caret"}
      fa={configMetadata.paceCaret.fa}
      extraSearchKeywords={getOptionSearchKeywords("paceCaret")}
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
                onChange: fromSchema(PaceCaretCustomSpeedSchema),
                onBlur: () => {
                  void form.handleSubmit();
                },
              }}
              children={(field) => (
                <div class="relative">
                  <InputField
                    field={field}
                    schema={PaceCaretCustomSpeedSchema}
                    placeholder={"pace caret speed"}
                    type="number"
                    resetToDefaultIfEmptyOnBlur
                  />
                  <savedIndicator.component />
                </div>
              )}
            />
          </form>
          <div class="grid grid-cols-[repeat(auto-fit,minmax(6rem,1fr))] gap-2">
            <For
              each={getOptions(ConfigSchema.shape.paceCaret)?.filter((option) =>
                isPaceCaretModeAvailable(
                  option,
                  getPaceCaretContext(),
                  serverConfiguration.data,
                ),
              )}
            >
              {(option) => {
                const displayString = getOptionLabel("paceCaret", option);
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
