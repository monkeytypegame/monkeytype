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
  const snapshotTags = getSnapshot()?.tags?.map((t) => t._id) ?? [];
  const allKnownTagIds = new Set(["none", ...snapshotTags]);

  for (const tag of allKnownTagIds) {
    newTags[tag] = result.tags[tag] ?? true;
  }

  result.tags = newTags;

  return result;
}

createEffect(() => {
  getSnapshot();
  setFilters(updateFilterStorage);
});
