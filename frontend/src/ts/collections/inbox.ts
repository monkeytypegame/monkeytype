import { baseKey } from "../queries/utils/keys";
import { createCollection, useLiveQuery } from "@tanstack/solid-db";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import Ape from "../ape";
import { queryClient } from "../queries";
import { isLoggedIn } from "../signals/core";

const queryKeys = {
  root: () => [...baseKey("inbox", { isUserSpecific: true })],
};

const inboxCollection = createCollection(
  queryCollectionOptions({
    staleTime: Infinity,
    queryKey: queryKeys.root(),
    queryClient,
    queryFn: async () => {
      const response = await Ape.users.getInbox();
      if (response.status !== 200) {
        throw new Error("Error fetching user inbox" + response.body.message);
      }
      return response.body.data.inbox;
    },
    getKey: (it) => it.id,
  }),
);

export function useInboxQuery() {
  return useLiveQuery((q) => {
    if (!isLoggedIn()) return undefined;
    return q
      .from({ inbox: inboxCollection })
      .orderBy(({ inbox }) => inbox.timestamp, "desc")
      .orderBy(({ inbox }) => inbox.subject, "asc");
  });
}
