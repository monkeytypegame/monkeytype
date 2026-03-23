import { ResultFilters, ResultFiltersSchema } from "@monkeytype/schemas/users";
import { useLocalStorageStore } from "../hooks/useLocalStorageStore";
import defaultResultFilters from "../constants/default-result-filters";
import { isObject } from "../utils/misc";
import { sanitize } from "../utils/sanitize";
import { mergeWithDefaultFilters } from "../components/pages/account/utils";

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
