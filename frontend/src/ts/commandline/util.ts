import { Config } from "../config/store";
import { setConfig } from "../config/setters";
import {
  CommandlineConfigKey,
  CommandlineInputMetadata,
  CommandlineMetadata,
  CommandlineSubgroupMetadata,
  ConfigMetadata,
  configMetadata,
  OptionMetadata,
  optionLabel,
} from "../config/metadata";
import { capitalizeFirstLetter } from "../utils/strings";
import {
  CommandlineConfigActions,
  commandlineConfigActions,
} from "./config-actions";
import { Command } from "./types";
import * as ConfigSchemas from "@monkeytype/schemas/configs";
import { ZodSchema, ZodFirstPartySchemaTypes } from "zod";
import { getOptions } from "../utils/zod";

export function buildCommandForConfigKey<
  // oxlint-disable-next-line no-unnecessary-type-parameters -- keeps key and its metadata types correlated
  K extends CommandlineConfigKey,
>(key: K): Command {
  const configMeta = configMetadata[key];
  const actions = commandlineConfigActions[key];
  const schema = ConfigSchemas.ConfigSchema.shape[key];

  return _buildCommandForConfigKey(key, configMeta, actions, schema);
}
function _buildCommandForConfigKey<K extends keyof ConfigSchemas.Config>(
  key: K,
  configMeta: ConfigMetadata<K>,
  actions: CommandlineConfigActions<K> | undefined,
  schema: ZodSchema,
): Command {
  const commandMeta: CommandlineMetadata<K> | null | undefined =
    configMeta.commandline;
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
      actions?.subgroup,
      configMeta,
      schema,
    );
  }

  if ("input" in commandMeta && commandMeta.input !== undefined) {
    const inputProps = commandMeta.input;

    const inputCommand = buildInputCommand({
      key: "secondKey" in inputProps ? inputProps.secondKey : key,
      isPartOfSubgroup: "subgroup" in commandMeta,
      inputProps: inputProps as CommandlineInputMetadata<
        keyof ConfigSchemas.Config
      >,
      inputActions: actions?.input,
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
  subgroupProps: CommandlineSubgroupMetadata<K>,
  subgroupActions: CommandlineConfigActions<K>["subgroup"],
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
      `Unsupported schema type for key "${key}": ${(schema as ZodFirstPartySchemaTypes)._def.typeName}`,
    );
  }
  const list = values.map((value) =>
    buildSubgroupCommand<K>(
      key,
      value,
      subgroupProps,
      subgroupActions,
      (
        configMeta.optionsMetadata as Record<string, OptionMetadata> | undefined
      )?.[String(value)],
    ),
  );

  list.sort((a, b) => {
    if (a.configValue === "off" || a.configValue === false) return -1;
    if (b.configValue === "off" || b.configValue === false) return 1;
    return 0;
  });

  return {
    id: `change${capitalizeFirstLetter(key)}`,
    display: display,
    fa: configMeta?.fa ?? { icon: "fa-cog" },
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
    display: commandDisplay,
    alias: commandAlias,
    configValueMode: commandConfigValueMode,
    isVisible: isCommandVisible,
    isAvailable: isCommandAvailable,
    customData: commandCustomData,
  }: CommandlineSubgroupMetadata<K>,
  { afterExec, hover }: CommandlineConfigActions<K>["subgroup"] = {},
  optionMeta?: OptionMetadata,
): Command {
  const val = value;

  // same label as the settings page unless the commandline overrides it
  const displayString =
    commandDisplay?.(value) ?? optionLabel(optionMeta, value);

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
  inputActions,
  configMeta,
  schema,
}: {
  key: K;
  isPartOfSubgroup: boolean;
  inputProps?: CommandlineInputMetadata<K>;
  inputActions?: CommandlineConfigActions<K>["input"];
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
    fa: configMeta?.fa ?? { icon: "fa-cog" },

    //@ts-expect-error this is fine
    exec: ({ input }): void => {
      if (input === undefined) return;
      setConfig(key, input as ConfigSchemas.Config[K]);
      inputActions?.afterExec?.();
    },
    hover: inputActions?.hover,
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
