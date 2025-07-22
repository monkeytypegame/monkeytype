import {
  CommandlineCommandMetadata,
  configMetadata,
  genericSet,
} from "../config";
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

  const subgroup: CommandsSubgroup = {
    title: display,
    configKey: key,
    list: values.map((value) => {
      //@ts-expect-error this type is super hard to figure out
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const metaCommandSettings = (meta?.commandline?.commands?.[value] ??
        undefined) as CommandlineCommandMetadata<typeof value> | undefined;

      const command = {
        id: `set${capitalizeFirstLetter(key)}${value}`,
        display: metaCommandSettings?.display ?? value,
        configValue: value,
        exec: (): void => {
          genericSet(key, value);
          metaCommandSettings?.afterExec?.(value);
          //@ts-expect-error this is also hard
          meta.commandline?.afterEachExec?.(value);
        },
      };

      return command;
    }),
  };

  return {
    id: `change${capitalizeFirstLetter(key)}`,
    display: display,
    icon: meta?.icon ?? "fa-cog",
    subgroup,
  };
}
