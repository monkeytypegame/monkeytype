import { configMetadata, genericSet } from "../config";
import { capitalizeFirstLetter } from "../utils/strings";
import { Command, CommandsSubgroup } from "./types";
import * as ConfigSchemas from "@monkeytype/schemas/configs";
import { z, ZodEnum } from "zod";

// Helper type to filter keys where the schema is a ZodEnum
type EnumConfigKeys = {
  // oxlint-disable-next-line no-explicit-any
  [K in keyof typeof ConfigSchemas.ConfigSchema.shape]: (typeof ConfigSchemas.ConfigSchema.shape)[K] extends ZodEnum<any>
    ? K
    : never;
}[keyof typeof ConfigSchemas.ConfigSchema.shape];

export function buildCommandForConfigMetadata(key: EnumConfigKeys): Command {
  const meta = configMetadata[key];

  const display = capitalizeFirstLetter(meta?.displayString ?? key) + "...";

  const schema = ConfigSchemas.ConfigSchema.shape[key];

  const values = Object.keys(schema.Values) as unknown as z.infer<
    typeof schema
  >[];

  // const displayValues = (meta.commandline?.displayValues ?? {}) as Record<
  //   string | number | symbol,
  //   string
  // >;

  const list = values.map((value) => {
    //@ts-expect-error this type is super hard to figure out
    const display = meta?.commandline?.commandDisplay?.(value) ?? value;
    //@ts-expect-error this type is super hard to figure out
    const alias = meta?.commandline?.commandAlias?.(value) ?? undefined;

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
    // if (a.configValue === "off" || a.configValue === false) return -1;
    // if (b.configValue === "off" || b.configValue === false) return 1;
    if (a.configValue === "off") return -1;
    if (b.configValue === "off") return 1;
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
