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
import { getSnapshot } from "../states/snapshot";

type QuoteUserRating = QuoteRating & {
  userRating?: number;
};

const queryKeys = {
  root: () => [...baseKey("quoteRatings", { isUserSpecific: true })],
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

      const language = parsed.filters.find((it) => it.field?.[0] === "language")
        ?.value as Language;
      const quoteId = parsed.filters.find((it) => it.field?.[0] === "quoteId")
        ?.value as number;

      const response = await Ape.quotes.getRating({
        query: { language, quoteId },
      });
      if (response.status !== 200) {
        throw new Error(
          "Error fetching quote ratings:" + response.body.message,
        );
      }

      const userRating = getSnapshot()?.quoteRatings?.[language]?.[quoteId];

      const existingData: QuoteUserRating[] =
        queryClient.getQueryData(queryKeys.root()) ?? [];

      if (response.body.data !== null) {
        existingData.push({ ...response.body.data, userRating });
      }

      return existingData;
    },
    onInsert: async ({ transaction }) => {
      const newItems = transaction.mutations.map((it) => it.modified);

      quoteRatingsCollection.utils.writeBatch(() => {
        newItems.forEach((item) => {
          quoteRatingsCollection.utils.writeInsert(item);
        });
      });

      newItems.forEach(async (it) => {
        if (it.userRating !== undefined) {
          const response = await Ape.quotes.addRating({
            body: {
              language: it.language,
              quoteId: it.quoteId,
              rating: it.userRating,
            },
          });
          if (response.status !== 200) {
            throw new Error(
              "Cannot submit quote rating: " + response.body.message,
            );
          }
        }
      });
    },
    onUpdate: async ({ transaction }) => {
      const newItems = transaction.mutations.map((it) => it.modified);

      //TODO update rating average and total
      quoteRatingsCollection.utils.writeBatch(() => {
        newItems.forEach((item) => {
          quoteRatingsCollection.utils.writeUpdate(item);
        });
      });

      newItems.forEach(async (it) => {
        if (it.userRating !== undefined) {
          const response = await Ape.quotes.addRating({
            body: {
              language: it.language,
              quoteId: it.quoteId,
              rating: it.userRating,
            },
          });
          if (response.status !== 200) {
            throw new Error(
              "Cannot submit quote rating: " + response.body.message,
            );
          }
        }
      });
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
      .where(({ r }) => eq(r.quoteId, filter.id))
      .findOne();
  });
}
