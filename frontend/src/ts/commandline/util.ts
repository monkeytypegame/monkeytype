import { genericSet } from "../config";
import { configMetadata } from "../config-metadata";
import { capitalizeFirstLetter } from "../utils/strings";
import {
  commandlineConfigMetadata,
  SubgroupMeta,
} from "./commandline-metadata";
import { Command } from "./types";
import * as ConfigSchemas from "@monkeytype/schemas/configs";
import { z } from "zod";

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

  let values: ConfigSchemas.Config[K][];

  if (schema instanceof z.ZodEnum) {
    values = Object.keys(schema.Values) as ConfigSchemas.Config[K][];
  } else if (schema instanceof z.ZodBoolean) {
    values = [true, false] as ConfigSchemas.Config[K][];
  } else {
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
