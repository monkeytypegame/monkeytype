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
  inputs?: JSXElement;
};

function Settings(props: Props): JSXElement {
  // oxlint-disable-next-line solid/reactivity no need for reactivity
  const configKey = props.configKey;
  const meta = configMetadata[configKey];

  const schema = ConfigSchema.shape[configKey];

  let schemaType = "unknown";

  console.log("schema", configKey, schema);
  const values = () => {
    if (schema._def.typeName === ZodFirstPartyTypeKind.ZodEnum) {
      schemaType = "enum";
      return schema._def.values as string[];
    }
    if (schema._def.typeName === ZodFirstPartyTypeKind.ZodBoolean) {
      schemaType = "boolean";
      return [false, true];
    }
    if (
      "_def" in schema &&
      schema._def.typeName === ZodFirstPartyTypeKind.ZodArray
    ) {
      const type = schema._def.type;
      if (type._def.typeName === ZodFirstPartyTypeKind.ZodEnum) {
        schemaType = "array-enum";
        return type._def.values as string[];
      }
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

    if (
      (meta.settingsVariant === "buttons" ||
        meta.settingsVariant === "buttonsFullWidth") &&
      values()
    ) {
      return (
        <div class="grid grid-cols-[repeat(auto-fit,minmax(12rem,1fr))] gap-2">
          <For each={values()}>
            {(value) => {
              const key = String(value);
              const om = meta.optionsMetadata as
                | Record<string, { displayString?: string }>
                | undefined;
              const text =
                om?.[key]?.displayString ??
                (typeof value === "boolean"
                  ? value
                    ? "on"
                    : "off"
                  : key.replace(/_/g, " "));

              const active = () => {
                if (schemaType.startsWith("array")) {
                  return (getConfig[configKey] as unknown as string[]).includes(
                    value as string,
                  );
                }
                return getConfig[configKey] === value;
              };

              const setter = () => {
                if (schemaType.startsWith("array")) {
                  const current = getConfig[configKey] as unknown as string[];
                  if (current.includes(value as string)) {
                    setConfig(
                      configKey,
                      current.filter(
                        (v) => v !== value,
                      ) as Config[keyof Config],
                    );
                  } else {
                    setConfig(configKey, [
                      ...current,
                      value,
                    ] as Config[keyof Config]);
                  }
                } else {
                  setConfig(configKey, value);
                }
              };

              const disabled = () => {
                const isBlocked = meta.isBlocked as
                  | ((opts: {
                      value: unknown;
                      currentConfig: Readonly<Config>;
                    }) => boolean)
                  | undefined;
                const v = schemaType.startsWith("array") ? [value] : value;
                return (
                  isBlocked?.({ value: v, currentConfig: getConfig }) ?? false
                );
              };

              return (
                <Button
                  text={text}
                  active={active()}
                  disabled={disabled()}
                  onClick={() => {
                    if (!schemaType.startsWith("array") && active()) return;
                    setter();
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
          meta.settingsVariant === "buttonsFullWidth" &&
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
    <div class="flex flex-col gap-8 border border-main">
      <Settings configKey="difficulty" />
      <Settings configKey="quickRestart" />
      <Settings configKey="resultSaving" />
      <Settings configKey="blindMode" />
      <Settings configKey="funbox" />
    </div>
  );
}
