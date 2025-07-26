import Config, { genericSet } from "../config";
import { ConfigMetadata, configMetadata } from "../config-metadata";
import { capitalizeFirstLetter } from "../utils/strings";
import {
  CommandlineConfigMetadata,
  commandlineConfigMetadata,
  CommandlineConfigMetadataObject,
  InputProps,
  SubgroupProps,
} from "./commandline-metadata";
import { Command } from "./types";
import * as ConfigSchemas from "@monkeytype/schemas/configs";
import { z, ZodSchema, ZodType } from "zod";

function getOptions<T extends ZodSchema>(schema: T): undefined | z.infer<T>[] {
  if (schema instanceof z.ZodLiteral) {
    return [schema.value] as z.infer<T>[];
  } else if (schema instanceof z.ZodEnum) {
    return schema.options as z.infer<T>[];
  } else if (schema instanceof z.ZodBoolean) {
    return [true, false] as z.infer<T>[];
  } else if (schema instanceof z.ZodUnion) {
    return (schema.options as ZodSchema[])
      .flatMap(getOptions)
      .filter((it) => it !== undefined) as z.infer<T>[];
  }
  return undefined;
}

export function buildCommandForConfigKey<
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
  K extends keyof CommandlineConfigMetadataObject
>(key: K): Command {
  const configMeta = configMetadata[key];
  const commandMeta = commandlineConfigMetadata[key];
  const schema = ConfigSchemas.ConfigSchema.shape[key];

  return _buildCommandForConfigKey(key, configMeta, commandMeta, schema);
}
function _buildCommandForConfigKey<
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
  K extends keyof CommandlineConfigMetadataObject
>(
  key: K,
  configMeta: ConfigMetadata<K>,
  commandMeta: CommandlineConfigMetadata<K> | undefined,
  schema: ZodType //TODO better type
): Command {
  if (commandMeta === undefined || commandMeta === null) {
    throw new Error(`No commandline metadata found for config key "${key}".`);
  }

  if (commandMeta.type === "subgroup") {
    return buildCommandWithSubgroup(key, commandMeta, configMeta, schema);
  } else if (commandMeta.type === "input") {
    return buildInputCommand({
      key,
      isPartOfSubgruop: false,
      commandMeta: commandMeta.input,
      configMeta,
      schema,
    });
  } else if (commandMeta.type === "subgroupWithInput") {
    const result = buildCommandWithSubgroup(
      key,
      commandMeta,
      configMeta,
      schema
    );
    result.subgroup?.list.push(
      buildInputCommand({
        key,
        isPartOfSubgruop: true,
        commandMeta: commandMeta.input,
        configMeta,
        schema,
      })
    );
    return result;
  } else if (commandMeta.type === "subgroupWithSecondKeyInput") {
    const result = buildCommandWithSubgroup(
      key,
      commandMeta,
      configMeta,
      schema
    );

    const secondConfigMeta = configMetadata[
      commandMeta.input.secondKey
    ] as ConfigMetadata<typeof commandMeta.input.secondKey>;

    result.subgroup?.list.push(
      buildInputCommand({
        isPartOfSubgruop: true,
        key: commandMeta.input.secondKey,
        commandMeta: commandMeta.input,
        configMeta: secondConfigMeta,
        schema: ConfigSchemas.ConfigSchema.shape[
          commandMeta.input.secondKey
        ] as ZodType,
      })
    );

    return result;
  }

  throw new Error(
    `Unsupported commandline metadata type for config key "${key}": ${
      (commandMeta as CommandlineConfigMetadata<K>)?.type
    }`
  );
}

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
function buildCommandWithSubgroup<K extends keyof ConfigSchemas.Config>(
  key: K,
  commandMeta: SubgroupProps<K>,
  configMeta: ConfigMetadata<K>,
  schema: ZodType //TODO better type
): Command {
  if (commandMeta === null) {
    throw new Error(`No commandline metadata found for config key "${key}".`);
  }

  const display =
    commandMeta?.rootDisplay ??
    `${capitalizeFirstLetter(configMeta?.displayString ?? key)}...`;

  let values =
    commandMeta.options ?? (getOptions(schema) as ConfigSchemas.Config[K][]);

  if (values === "fromSchema") {
    values = getOptions(schema) as ConfigSchemas.Config[K][];
  }

  if (values === undefined) {
    throw new Error(
      //@ts-expect-error todo
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
    commandConfigValueMode,
    isCommandVisible,
    isCommandAvailable,
    commandCustomData,
  }: SubgroupProps<K>
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
    configValueMode: commandConfigValueMode?.(value),
    alias: commandAlias?.(value) ?? undefined,
    configValue: val,
    visible: isCommandVisible?.(value) ?? undefined,
    available: isCommandAvailable?.(value) ?? undefined,
    exec: (): void => {
      genericSet(key, val);
      afterExec?.(val);
    },
    hover: (): void => {
      hover?.(val);
    },
    customData: commandCustomData?.(val) ?? undefined,
  };
}

function buildInputCommand<K extends keyof ConfigSchemas.Config>({
  key,
  isPartOfSubgruop,
  commandMeta,
  configMeta,
  schema,
}: {
  key: K;
  isPartOfSubgruop: boolean;
  commandMeta?: InputProps<K>;
  configMeta: ConfigMetadata<K>;
  schema?: ZodType; //TODO better type
}): Command {
  const validation = commandMeta?.validation ?? { schema: true };

  const displayString = isPartOfSubgruop
    ? commandMeta?.display ?? "custom..."
    : capitalizeFirstLetter(configMeta.displayString ?? key) + "...";

  const result = {
    id: `set${capitalizeFirstLetter(key)}Custom`,
    defaultValue:
      commandMeta?.defaultValue ?? (() => Config[key]?.toString() ?? ""),
    configValue:
      commandMeta !== undefined && "configValue" in commandMeta
        ? commandMeta.configValue ?? undefined
        : undefined,
    display: displayString,
    alias: commandMeta?.alias ?? undefined,
    input: true,
    icon: configMeta.icon ?? "fa-cog",

    //@ts-expect-error this is fine
    exec: ({ input }): void => {
      if (input === undefined) return;
      genericSet(key, input as ConfigSchemas.Config[K]);
      commandMeta?.afterExec?.(input as ConfigSchemas.Config[K]);
    },
    hover: (): void => {
      commandMeta?.hover?.();
    },
  };

  if (commandMeta?.inputValueConvert !== undefined) {
    //@ts-expect-error this is fine
    result["inputValueConvert"] = commandMeta.inputValueConvert;
  }

  //@ts-expect-error this is fine
  result["validation"] = {
    schema: validation.schema === true ? schema : undefined,
    isValid: validation.isValid,
  };

  return result as Command;
}

export const __testing = { _buildCommandForConfigKey };
