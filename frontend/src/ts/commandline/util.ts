import { genericSet } from "../config";
import { configMetadata } from "../config-metadata";
import { capitalizeFirstLetter } from "../utils/strings";
import { commandlineConfigMetadata } from "./metadata";
import { Command, CommandsSubgroup } from "./types";
import * as ConfigSchemas from "@monkeytype/schemas/configs";
import { z } from "zod";

export function buildCommandForConfigMetadata(
  key: keyof ConfigSchemas.Config
): Command {
  const configMeta = configMetadata[key];
  const commandMeta = commandlineConfigMetadata[key];

  const display =
    capitalizeFirstLetter(configMeta?.displayString ?? key) + "...";

  const schema = ConfigSchemas.ConfigSchema.shape[key];

  let values;

  if (schema instanceof z.ZodEnum) {
    values = Object.keys(schema.Values);
  } else if (schema instanceof z.ZodBoolean) {
    values = [true, false];
  } else {
    throw new Error(
      `Unsupported schema type for key "${key}": ${schema._def.typeName}`
    );
  }

  const list: Command[] = values.map((value) => {
    //@ts-expect-error cant figure out this type
    let display = commandMeta?.commandDisplay?.(value);
    //@ts-expect-error cant figure out this type
    const alias = commandMeta?.commandAlias?.(value) ?? undefined;

    if (display === undefined) {
      if (value === true) {
        display = "on";
      } else if (value === false) {
        display = "off";
      } else {
        display = value.toString();
      }
    }

    const command = {
      id: `set${capitalizeFirstLetter(key)}${value}`,
      display,
      alias,
      configValue: value,
      exec: (): void => {
        genericSet(key, value);
        //@ts-expect-error cant figure out this type
        commandMeta?.afterExec?.(value);
      },
    };

    return command;
  });

  list.sort((a, b) => {
    if (a.configValue === "off" || a.configValue === false) return -1;
    if (b.configValue === "off" || b.configValue === false) return 1;
    return 0;
  });

  const subgroup: CommandsSubgroup = {
    title: display,
    configKey: key,
    list,
  };

  return {
    id: `change${capitalizeFirstLetter(key)}`,
    display: display,
    icon: configMeta?.icon ?? "fa-cog",
    subgroup,
  };
}
