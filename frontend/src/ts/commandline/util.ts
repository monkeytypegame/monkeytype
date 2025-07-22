import { configMetadata, genericSet } from "../config";
import { capitalizeFirstLetter } from "../utils/strings";
import { Command, CommandsSubgroup } from "./types";
import * as ConfigSchemas from "@monkeytype/schemas/configs";
import { z } from "zod";

export function buildCommandForConfigMetadata(
  key: keyof typeof configMetadata
): Command {
  const meta = configMetadata[key];

  const display = capitalizeFirstLetter(meta?.displayString ?? key) + "...";

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

  // const displayValues = (meta.commandline?.displayValues ?? {}) as Record<
  //   string | number | symbol,
  //   string
  // >;

  const list: Command[] = values.map((value) => {
    let display =
      //@ts-expect-error this type is hard to figure out
      meta?.commandline?.commandDisplay?.(value);
    //@ts-expect-error this type is hard to figure out
    const alias = meta?.commandline?.commandAlias?.(value) ?? undefined;

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
        //@ts-expect-error this is also hard
        meta.commandline?.afterExec?.(value);
      },
    };

    return command;
  });

  //put configValue off or false at the start of the list
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
    icon: meta?.icon ?? "fa-cog",
    subgroup,
  };
}
