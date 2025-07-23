import { genericSet } from "../config";
import { ConfigMetadata, configMetadata } from "../config-metadata";
import { capitalizeFirstLetter } from "../utils/strings";
import {
  CommandlineConfigMetadata,
  commandlineConfigMetadata,
} from "./commandline-metadata";
import { Command } from "./types";
import * as ConfigSchemas from "@monkeytype/schemas/configs";
import { z, ZodSchema } from "zod";

function getOptions<T extends ZodSchema>(schema: T): undefined | z.infer<T>[] {
  if (schema instanceof z.ZodLiteral) {
    return [schema.value] as z.infer<T>[];
  } else if (schema instanceof z.ZodUnion) {
    return (schema.options as ZodSchema[])
      .flatMap(getOptions)
      .filter((it) => it !== undefined) as z.infer<T>[];
  } else if (schema instanceof z.ZodEnum) {
    return schema.options as z.infer<T>[];
  } else if (schema instanceof z.ZodBoolean) {
    return [true, false] as z.infer<T>[];
  }
  return undefined;
}

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
export function buildCommandForConfigKey<K extends keyof ConfigSchemas.Config>(
  key: K
): Command {
  return buildCommandWithSubgroup(key);
}

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
function buildCommandWithSubgroup<K extends keyof ConfigSchemas.Config>(
  key: K
): Command {
  const configMeta = configMetadata[key];
  const commandMeta = commandlineConfigMetadata[key];
  const schema = ConfigSchemas.ConfigSchema.shape[key];

  if (commandMeta === undefined) {
    throw new Error(`missing command meta for key ${key}`);
  }

  return _buildCommandWithSubgroup(key, configMeta, commandMeta, schema);
}
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
function _buildCommandWithSubgroup<K extends keyof ConfigSchemas.Config>(
  key: K,
  configMeta: ConfigMetadata<K>,
  commandMeta: CommandlineConfigMetadata<K>,
  schema: ZodSchema //TODO better type
): Command {
  const display =
    commandMeta?.rootDisplay ??
    `${capitalizeFirstLetter(configMeta?.displayString ?? key)}...`;

  let values = getOptions(schema) as ConfigSchemas.Config[K][];

  if (values === undefined) {
    throw new Error(
      //@ts-expect-error TODO find better type
      `Unsupported schema type for key "${key}": ${schema._def.typeName}`
    );
  }
  const list = values.map((value) =>
    buildSetCommand<K>(key, value, commandMeta)
  );

  list.sort((a, b) => {
    if (a.configValue === "off" || a.configValue === false) return -1;
    if (b.configValue === "off" || b.configValue === false) return 1;
    return 0;
  });

  return {
    id: `change${capitalizeFirstLetter(key)}`,
    display: display,
    icon: configMeta?.icon ?? "fa-cog",
    subgroup: {
      title: display,
      configKey: key,
      list,
    },
    alias: commandMeta?.rootAlias,
  };
}

function buildSetCommand<K extends keyof ConfigSchemas.Config>(
  key: keyof ConfigSchemas.Config,
  value: ConfigSchemas.Config[K],
  {
    afterExec,
    hover,
    commandDisplay,
    commandAlias,
    isCommandVisible,
  }: CommandlineConfigMetadata<K> = {}
): Command {
  const val = value;

  let displayString = commandDisplay?.(value);

  if (displayString === undefined) {
    if (value === true) {
      displayString = "on";
    } else if (value === false) {
      displayString = "off";
    } else {
      displayString = value.toString();
    }
  }

  return {
    id: `set${capitalizeFirstLetter(key)}${capitalizeFirstLetter(
      val.toString()
    )}`,
    display: displayString,
    alias: commandAlias?.(value) ?? undefined,
    configValue: val,
    visible: isCommandVisible?.(value) ?? undefined,
    exec: (): void => {
      genericSet(key, val);
      afterExec?.(val);
    },
    hover: (): void => {
      hover?.(val);
    },
  };
}

export const __testing = { _buildCommandWithSubgroup };
