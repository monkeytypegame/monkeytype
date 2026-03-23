import { ResultFilters, ResultFiltersSchema } from "@monkeytype/schemas/users";
import { typedKeys } from "../../../utils/misc";
import defaultResultFilters from "../../../constants/default-result-filters";
import { sanitize } from "../../../utils/sanitize";

export function mergeWithDefaultFilters(
  filters: Partial<ResultFilters>,
): ResultFilters {
  try {
    const merged = {} as ResultFilters;
    for (const groupKey of typedKeys(defaultResultFilters)) {
      if (groupKey === "_id") {
        let id = filters[groupKey] ?? defaultResultFilters[groupKey];
        if (id === "default-result-filters-id" || id === "") {
          id = "default";
        }
        merged[groupKey] = id;
      } else if (groupKey === "name") {
        merged[groupKey] = filters[groupKey] ?? defaultResultFilters[groupKey];
      } else {
        // @ts-expect-error i cant figure this out
        merged[groupKey] = {
          ...defaultResultFilters[groupKey],
          ...filters[groupKey],
        };
      }
    }
    return merged;
  } catch (e) {
    return defaultResultFilters;
  }
}

export function verifyResultFiltersStructure(
  filterIn: ResultFilters,
): ResultFilters {
  const filter = mergeWithDefaultFilters(
    sanitize(ResultFiltersSchema.partial().strip(), structuredClone(filterIn)),
  );

  return filter;
}
