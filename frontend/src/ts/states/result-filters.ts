import { ResultFilters, ResultFiltersSchema } from "@monkeytype/schemas/users";
import { mergeWithDefaultFilters } from "../components/pages/account/utils";
import defaultResultFilters from "../constants/default-result-filters";
import { useLocalStorageStore } from "../hooks/useLocalStorageStore";
import { isObject } from "../utils/misc";
import { sanitize } from "../utils/sanitize";

export const [filters, setFilters] = useLocalStorageStore({
  key: "resultFilters",
  schema: ResultFiltersSchema,
  fallback: defaultResultFilters,
  migrate: migrateFilterStorage,
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

export function updateTagsInFilterStorage(tagsIds: string[]): void {
  setFilters((filters) => {
    const result = mergeWithDefaultFilters(filters);
    const snapshotTags = new Set(["none", ...tagsIds]);

    //remove tags that no longer exist.
    let newTags = new Map(
      Object.entries(result.tags).filter(([id]) => snapshotTags.has(id)),
    );

    //add new tags added
    tagsIds
      .filter((id) => !newTags.has(id))
      .forEach((newId) => newTags.set(newId, true));

    result.tags = Object.fromEntries(newTags.entries());
    return result;
  });
}
