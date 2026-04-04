import { Config, ConfigSchema } from "@monkeytype/schemas/configs";
import { JSXElement, For } from "solid-js";
import { ZodFirstPartyTypeKind } from "zod";

import { configMetadata } from "../../../config/metadata";
import { setConfig } from "../../../config/setters";
import { getConfig } from "../../../config/store";
import { cn } from "../../../utils/cn";
import { Button } from "../../common/Button";
import { Conditional } from "../../common/Conditional";
import { H3 } from "../../common/Headers";

type Props = {
  configKey: keyof Config;
  fullWidthInputs?: boolean;
  inputs?: JSXElement;
};

function Settings(props: Props): JSXElement {
  // oxlint-disable-next-line solid/reactivity no need for reactivity
  const configKey = props.configKey;
  const meta = configMetadata[configKey];

  const schema = ConfigSchema.shape[configKey];

  console.log("schema", configKey, schema);
  const values = () => {
    if ("options" in schema) {
      return schema.options as string[];
    }
    if (schema._def.typeName === ZodFirstPartyTypeKind.ZodBoolean) {
      return [false, true];
    }
    return undefined;
  };

  const inputs = () => {
    if (meta.settingsVariant === undefined) {
      return (
        <div class="text-center text-error">
          No settings variant defined for this setting
        </div>
      );
    }

    if (meta.settingsVariant === "buttons" && values()) {
      return (
        <div class="grid grid-flow-col gap-2">
          <For each={values()}>
            {(value) => {
              const text =
                typeof value === "boolean"
                  ? value
                    ? "on"
                    : "off"
                  : String(value);

              return (
                <Button
                  text={text}
                  active={getConfig[configKey] === value}
                  onClick={() => {
                    if (getConfig[configKey] === value) return;
                    setConfig(configKey, value);
                  }}
                />
              );
            }}
          </For>
        </div>
      );
    }

    return (
      <div class="text-center text-error">
        No inputs defined for this setting
      </div>
    );
  };

  return (
    <div class="group">
      <div class="flex gap-2 pb-[0.5em]">
        <H3 text={meta.displayString ?? configKey} fa={meta.fa} class="pb-0" />
        <Button
          class="-m-2 p-2 opacity-0 group-hover:opacity-100"
          variant="text"
          fa={{ icon: "fa-link" }}
        />
      </div>
      <div
        class={cn(
          "grid grid-cols-1 gap-2",
          "md:grid-cols-[1fr_1fr] md:gap-x-8",
          "lg:grid-cols-[1.5fr_1fr]",
          "xl:grid-cols-[2fr_1fr]",
          props.fullWidthInputs &&
            "grid-cols-1 md:grid-cols-1 lg:grid-cols-1 xl:grid-cols-1",
        )}
      >
        <Conditional
          if={meta.description}
          then={<div class="">{meta.description}</div>}
          else={
            <div class="text-error">
              No description provided for this setting
            </div>
          }
        />
        <div>{inputs()}</div>
      </div>
    </div>
  );
}

export function SettingsTest(): JSXElement {
  return (
    <div class="flex flex-col gap-8">
      <Settings configKey="difficulty" />
      <Settings configKey="quickRestart" />
      <Settings configKey="resultSaving" />
    </div>
  );
}
