import { Language } from "@monkeytype/schemas/languages";
import { QuoteRating } from "@monkeytype/schemas/quotes";
import {
  parseLoadSubsetOptions,
  queryCollectionOptions,
} from "@tanstack/query-db-collection";
import { createCollection, eq, useLiveQuery } from "@tanstack/solid-db";
import { Accessor } from "solid-js";
import { queryClient } from "../queries";
import { baseKey } from "../queries/utils/keys";
import Ape from "../ape";

export type QuoteUserRating = {
  id: number;
  language: Language;
  rating: number; //0..5
};
const queryKeys = {
  root: () => [...baseKey("quoteRatings")],
  user: () => [...baseKey("userQuoteRatings", { isUserSpecific: true })],
};

export const quoteRatingsCollection = createCollection(
  queryCollectionOptions({
    staleTime: Infinity,
    queryKey: queryKeys.root(),
    syncMode: "on-demand", // Enable predicate push-down
    queryFn: async ({ meta }) => {
      if (meta?.loadSubsetOptions === undefined) {
        throw new Error("missing where clause in quoteRatingsCollection");
      }
      const { where } = meta.loadSubsetOptions;
      const parsed = parseLoadSubsetOptions({ where });

      const language = parsed.filters.find(
        (it) => it.field?.[0] === "language",
      )?.value;
      const quoteId = parsed.filters.find(
        (it) => it.field?.[0] === "quoteId",
      )?.value;

      const response = await Ape.quotes.getRating({
        query: { language, quoteId },
      });
      if (response.status !== 200) {
        throw new Error(
          "Error fetching quote ratings:" + response.body.message,
        );
      }

      const existingData: QuoteRating[] =
        queryClient.getQueryData(queryKeys.root()) ?? [];

      if (response.body.data !== null) {
        existingData.push(response.body.data);
      }

      return existingData;
    },

    queryClient,
    getKey: (it) => it._id,
  }),
);

// oxlint-disable-next-line typescript/explicit-function-return-type
export function useQuoteRatingsLiveQuery(
  filterAccessor: Accessor<{
    language: Language;
    id: number;
  } | null>,
) {
  return useLiveQuery((q) => {
    const filter = filterAccessor();
    if (filter === null) return undefined;
    return q
      .from({ r: quoteRatingsCollection })
      .where(({ r }) => eq(r.language, filter.language))
      .where(({ r }) => eq(r.quoteId, filter.id));
  });
}

export const userQuoteRatingsCollection = createCollection(
  queryCollectionOptions({
    staleTime: Infinity,
    queryKey: queryKeys.root(),
    queryClient,
    getKey: (it) => it.language + it.id,
    queryFn: async () => {
      //filled from the user query
      return [] as QuoteUserRating[];
    },
  }),
);
