import { genericSet } from "../config";
import { configMetadata } from "../config-metadata";
import { capitalizeFirstLetter } from "../utils/strings";
import {
  commandlineConfigMetadata,
  SubgroupMeta,
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
  const commandMeta = commandlineConfigMetadata[key];

  if (commandMeta === undefined || commandMeta === null) {
    throw new Error(`No commandline metadata found for config key "${key}".`);
  }

  if (commandMeta.type === "subgroup") {
    return buildCommandWithSubgroup(key, commandMeta);
  }

  throw new Error(
    `Unsupported commandline metadata type for config key "${key}": ${commandMeta.type}`
  );
}

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
function buildCommandWithSubgroup<K extends keyof ConfigSchemas.Config>(
  key: K,
  commandMeta: SubgroupMeta<K>
): Command {
  const configMeta = configMetadata[key];

  if (commandMeta === null) {
    throw new Error(`No commandline metadata found for config key "${key}".`);
  }

  const display =
    commandMeta?.rootDisplay ??
    `${capitalizeFirstLetter(configMeta?.displayString ?? key)}...`;
  const schema = ConfigSchemas.ConfigSchema.shape[key];

  let values =
    commandMeta.options ?? (getOptions(schema) as ConfigSchemas.Config[K][]);

  if (values === "fromSchema") {
    values = getOptions(schema) as ConfigSchemas.Config[K][];
  }

  if (values === undefined) {
    throw new Error(
      `Unsupported schema type for key "${key}": ${schema._def.typeName}`
    );
  }
  const list = values.map((value) =>
    buildSubgroupCommand<K>(key, value, commandMeta)
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

function buildSubgroupCommand<K extends keyof ConfigSchemas.Config>(
  key: keyof ConfigSchemas.Config,
  value: ConfigSchemas.Config[K],
  {
    afterExec,
    hover,
    commandDisplay,
    commandAlias,
    isCommandVisible,
  }: SubgroupMeta<K>
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

// export const __testing = { _buildCommandWithSubgroup };
