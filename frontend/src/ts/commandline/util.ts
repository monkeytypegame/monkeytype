import Config, { setConfig } from "../config";
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
import { z, ZodSchema } from "zod";

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
  // oxlint-disable-next-line no-unnecessary-type-parameters
  K extends keyof CommandlineConfigMetadataObject,
>(key: K): Command {
  const configMeta = configMetadata[key];
  const commandMeta = commandlineConfigMetadata[key];
  const schema = ConfigSchemas.ConfigSchema.shape[key];

  return _buildCommandForConfigKey(key, configMeta, commandMeta, schema);
}
function _buildCommandForConfigKey<
  K extends keyof CommandlineConfigMetadataObject,
>(
  key: K,
  configMeta: ConfigMetadata<K>,
  commandMeta:
    | CommandlineConfigMetadata<K, keyof ConfigSchemas.Config>
    | undefined,
  schema: ZodSchema,
): Command {
  if (commandMeta === undefined || commandMeta === null) {
    throw new Error(`No commandline metadata found for config key "${key}".`);
  }

  let result: Command | undefined = undefined;

  if ("subgroup" in commandMeta && commandMeta.subgroup !== undefined) {
    result = buildCommandWithSubgroup(
      key,
      commandMeta.display,
      commandMeta.alias,
      commandMeta.subgroup,
      configMeta,
      schema,
    );
  }

  if ("input" in commandMeta && commandMeta.input !== undefined) {
    const inputProps = commandMeta.input;

    const inputCommand = buildInputCommand({
      key: "secondKey" in inputProps ? inputProps.secondKey : key,
      isPartOfSubgroup: "subgroup" in commandMeta,
      inputProps: inputProps as InputProps<keyof ConfigSchemas.Config>,
      configMeta: configMeta as unknown as ConfigMetadata<
        keyof ConfigSchemas.Config
      >,
      schema:
        "secondKey" in inputProps
          ? ConfigSchemas.ConfigSchema.shape[inputProps.secondKey]
          : schema,
    });

    if (result === undefined) {
      return inputCommand;
    }

    result.subgroup?.list.push(inputCommand);
  }

  if (result === undefined) {
    throw new Error(
      `Nothing returned for config key "${key}". This is a bug in the commandline metadata.`,
    );
  }
  return result;
}

function buildCommandWithSubgroup<K extends keyof ConfigSchemas.Config>(
  key: K,
  rootDisplay: string | undefined,
  rootAlias: string | undefined,
  subgroupProps: SubgroupProps<K>,
  configMeta: ConfigMetadata<K>,
  schema: ZodSchema,
): Command {
  if (subgroupProps === null) {
    throw new Error(`No commandline metadata found for config key "${key}".`);
  }

  const display =
    rootDisplay ??
    `${capitalizeFirstLetter(configMeta?.displayString ?? key)}...`;

  let values =
    subgroupProps.options ?? (getOptions(schema) as ConfigSchemas.Config[K][]);

  if (values === "fromSchema") {
    values = getOptions(schema) as ConfigSchemas.Config[K][];
  }

  if (values === undefined) {
    throw new Error(
      //@ts-expect-error todo
      `Unsupported schema type for key "${key}": ${schema._def.typeName}`,
    );
  }
  const list = values.map((value) =>
    buildSubgroupCommand<K>(key, value, subgroupProps),
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
    alias: rootAlias,
  };
}

function buildSubgroupCommand<K extends keyof ConfigSchemas.Config>(
  key: keyof ConfigSchemas.Config,
  value: ConfigSchemas.Config[K],
  {
    afterExec,
    hover,
    display: commandDisplay,
    alias: commandAlias,
    configValueMode: commandConfigValueMode,
    isVisible: isCommandVisible,
    isAvailable: isCommandAvailable,
    customData: commandCustomData,
  }: SubgroupProps<K>,
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
      val.toString(),
    )}`,
    display: displayString,
    configValueMode: commandConfigValueMode?.(value),
    alias: commandAlias?.(value) ?? undefined,
    configValue: val,
    visible: isCommandVisible?.(value) ?? undefined,
    available: isCommandAvailable?.(value) ?? undefined,
    exec: (): void => {
      setConfig(key, val);
      afterExec?.(val);
    },
    hover:
      hover !== undefined
        ? (): void => {
            hover?.(val);
          }
        : undefined,
    customData: commandCustomData?.(val) ?? undefined,
  };
}

function buildInputCommand<K extends keyof ConfigSchemas.Config>({
  key,
  isPartOfSubgroup,
  inputProps,
  configMeta,
  schema,
}: {
  key: K;
  isPartOfSubgroup: boolean;
  inputProps?: InputProps<K>;
  configMeta: ConfigMetadata<K>;
  schema?: ZodSchema;
}): Command {
  const validation = inputProps?.validation ?? { schema: true };

  const displayString =
    inputProps?.display ??
    (isPartOfSubgroup
      ? "custom..."
      : `${capitalizeFirstLetter(configMeta.displayString ?? key)}...`);

  const result = {
    id: `set${capitalizeFirstLetter(key)}Custom`,
    defaultValue:
      inputProps?.defaultValue ?? (() => Config[key]?.toString() ?? ""),
    configValue:
      inputProps !== undefined && "configValue" in inputProps
        ? (inputProps.configValue ?? undefined)
        : undefined,
    display: displayString,
    alias: inputProps?.alias ?? undefined,
    input: true,
    icon: configMeta.icon ?? "fa-cog",

    //@ts-expect-error this is fine
    exec: ({ input }): void => {
      if (input === undefined) return;
      setConfig(key, input as ConfigSchemas.Config[K]);
      inputProps?.afterExec?.(input as ConfigSchemas.Config[K]);
    },
    hover: inputProps?.hover,
  };

  if (inputProps?.inputValueConvert !== undefined) {
    //@ts-expect-error this is fine
    result["inputValueConvert"] = inputProps.inputValueConvert;
  }

  //@ts-expect-error this is fine
  result["validation"] = {
    schema: validation.schema === true ? schema : undefined,
    isValid: validation.isValid,
  };

  return result as Command;
}

export const __testing = { _buildCommandForConfigKey };
