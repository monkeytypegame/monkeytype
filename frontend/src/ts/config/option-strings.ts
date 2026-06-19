import { Config, ConfigSchema } from "@monkeytype/schemas/configs";

import { getOptions } from "../utils/zod";
import { configMetadata, OptionMetadata } from "./metadata";

// the label shown for a single option (and used to match it while searching)
export function getOptionLabel<T extends keyof Config>(
  key: T,
  option: Config[T],
): string {
  const optionMeta = (
    configMetadata[key] as {
      optionsMetadata?: Record<string, OptionMetadata> | undefined;
    }
  ).optionsMetadata?.[String(option)];

  if (optionMeta?.displayString !== undefined) return optionMeta.displayString;
  if (option === true) return "on";
  if (option === false) return "off";
  return String(option).replace(/_/g, " ");
}

// all of a setting's option labels joined, so the settings search can match on them
export function getOptionSearchTerms<T extends keyof Config>(key: T): string {
  const optionsMeta = (
    configMetadata[key] as {
      optionsMetadata?: Record<string, OptionMetadata> | undefined;
    }
  ).optionsMetadata;

  const options = getOptions(ConfigSchema.shape[key])?.filter(
    (option) => optionsMeta?.[String(option)]?.visible !== false,
  );
  if (options === undefined) return "";

  return options
    .map((option) => getOptionLabel(key, option as Config[T]))
    .join(" ");
}
