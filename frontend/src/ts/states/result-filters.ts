import { ResultFilters, ResultFiltersSchema } from "@monkeytype/schemas/users";
import { createEffect } from "solid-js";
import { mergeWithDefaultFilters } from "../components/pages/account/utils";
import defaultResultFilters from "../constants/default-result-filters";
import { useLocalStorageStore } from "../hooks/useLocalStorageStore";
import { isObject } from "../utils/misc";
import { sanitize } from "../utils/sanitize";
import { getSnapshot } from "./snapshot";

export const [filters, setFilters] = useLocalStorageStore({
  key: "resultFilters",
  schema: ResultFiltersSchema,
  fallback: defaultResultFilters,
  migrate: migrateFilterStorage,
  afterParse: updateFilterStorage,
});

function migrateFilterStorage(input: unknown): ResultFilters {
  if (!isObject(input)) {
    return defaultResultFilters;
  }
  const filters = sanitize(
    ResultFiltersSchema.partial().strip(),
    input as ResultFilters,
  );
  return mergeWithDefaultFilters(filters);
}

function updateFilterStorage(filters: ResultFilters): ResultFilters {
  const result = mergeWithDefaultFilters(filters);
  const newTags: Record<string, boolean> = { none: false };
  Object.keys(defaultResultFilters.tags).forEach((tag) => {
    if (result.tags[tag] !== undefined) {
      newTags[tag] = result.tags[tag];
    } else {
      newTags[tag] = true;
    }
  });

  result.tags = newTags;

  return result;
}

createEffect(() => {
  getSnapshot()?.tags?.forEach((tag) => {
    defaultResultFilters.tags[tag._id] ??= true;
  });
  setFilters(updateFilterStorage);
});
