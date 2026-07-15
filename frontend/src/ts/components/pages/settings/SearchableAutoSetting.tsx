import { Config, ConfigKey, ConfigSchema } from "@monkeytype/schemas/configs";
import { createForm } from "@tanstack/solid-form";
import { For, JSXElement } from "solid-js";
import { z } from "zod";

import {
  configMetadata,
  ConfigMetadataObject,
  getOptionLabel,
  getOptionSearchKeywords,
  getVisibleOptions,
} from "../../../config/metadata";
import { setConfig } from "../../../config/setters";
import { getConfig } from "../../../config/store";
import { useSavedIndicator } from "../../../hooks/useSavedIndicator";
import { cn } from "../../../utils/cn";
import { Button } from "../../common/Button";
import { InputField } from "../../ui/form/InputField";
import { fromSchema } from "../../ui/form/utils";
import { SearchableSetting } from "./SearchableSetting";

export function SearchableAutoSetting<T extends ConfigKey>(props: {
  key: T;
  inputs?: JSXElement;
  wide?: boolean;
  onOptionClick?: (value: Config[T]) => void;
}): JSXElement {
  const savedIndicator = useSavedIndicator();

  const form = createForm(() => ({
    defaultValues: {
      [props.key]: getConfig[props.key],
    },
    onSubmit: ({ value }) => {
      const val = value[props.key];
      if (val === getConfig[props.key]) return;
      savedIndicator.flash();
      setConfig(props.key, val as Config[T]);
    },
  }));

  const autoInputs = () => {
    if (
      ConfigSchema.shape[props.key]._def.typeName ===
      z.ZodFirstPartyTypeKind.ZodNumber
    ) {
      return (
        <div class="grid w-full gap-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void form.handleSubmit();
            }}
          >
            <form.Field
              //@ts-expect-error -- i think because props.key is a key of config, which is a zod schema, the typechecker gives up (too complex to infer or something)
              name={props.key}
              validators={{
                onChange: fromSchema(
                  ConfigSchema.shape[props.key] as z.ZodNumber,
                ),
                onBlur: () => {
                  void form.handleSubmit();
                },
              }}
              children={(field) => (
                <div class="relative">
                  <InputField
                    field={field}
                    schema={ConfigSchema.shape[props.key]}
                    placeholder={
                      (configMetadata as ConfigMetadataObject)[props.key]
                        .displayString ?? props.key
                    }
                    type="number"
                    resetToDefaultIfEmptyOnBlur
                  />
                  <savedIndicator.component />
                </div>
              )}
            />
          </form>
        </div>
      );
    }

    const options = getVisibleOptions(props.key);

    if (options !== undefined) {
      return (
        <div
          class={cn(
            "grid grid-cols-[repeat(auto-fit,minmax(4.5rem,1fr))] gap-2",
            props.wide && "grid-cols-[repeat(auto-fit,minmax(13.5rem,1fr))]",
          )}
        >
          <For each={options}>
            {(option) => (
              <Button
                active={getConfig[props.key] === option}
                onClick={() => {
                  if (getConfig[props.key] === option) return;
                  props.onOptionClick?.(option);
                  setConfig(props.key, option);
                }}
              >
                {getOptionLabel(props.key, option)}
              </Button>
            )}
          </For>
        </div>
      );
    }
    return undefined;
  };

  return (
    <SearchableSetting
      key={props.key}
      title={
        (configMetadata as ConfigMetadataObject)[props.key].displayString ??
        props.key
      }
      fa={(configMetadata as ConfigMetadataObject)[props.key].fa}
      description={
        (configMetadata as ConfigMetadataObject)[props.key].description
      }
      extraSearchKeywords={getOptionSearchKeywords(props.key)}
      inputs={!props.wide ? autoInputs() : props.inputs}
      fullWidthInputs={
        props.wide ? (autoInputs() ?? props.inputs) : props.inputs
      }
    />
  );
}
