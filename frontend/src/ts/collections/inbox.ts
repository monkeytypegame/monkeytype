import { baseKey } from "../queries/utils/keys";
import { createCollection, useLiveQuery } from "@tanstack/solid-db";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import Ape from "../ape";
import { queryClient } from "../queries";
import { isLoggedIn } from "../signals/core";
import { MonkeyMail } from "@monkeytype/schemas/users";
import { Accessor, createSignal } from "solid-js";

const queryKeys = {
  root: () => [...baseKey("inbox", { isUserSpecific: true })],
};

const [maxMailboxSize, setMaxMailboxSize] = createSignal(0);

export { maxMailboxSize };

export type InboxItem = Omit<MonkeyMail, "read"> & {
  status: "unclaimed" | "unread" | "read" | "deleted";
};
export const inboxCollection = createCollection(
  queryCollectionOptions({
    staleTime: 1000 * 60 * 5,
    queryKey: queryKeys.root(),

    queryFn: async () => {
      const addStatus = (item: MonkeyMail): InboxItem => ({
        ...item,
        status: (item.rewards.length > 0 && !item.read
          ? "unclaimed"
          : item.read
            ? "read"
            : "unread") as InboxItem["status"],
      });

      const response = await Ape.users.getInbox();
      if (response.status !== 200) {
        throw new Error("Error fetching user inbox" + response.body.message);
      }
      setMaxMailboxSize(response.body.data.maxMail);
      return response.body.data.inbox.map(addStatus);
    },
    onUpdate: async ({ transaction }) => {
      const updatedStatus = Object.groupBy(
        transaction.mutations
          .filter((it) => it.original.status !== it.modified.status)
          .map((it) => it.modified),
        (it) => it.status,
      );

      /*
      Ape.users.updateInbox({
        body: {
          mailIdsToDelete: updatedStatus.deleted?.map((it) => it.id),
          mailIdsToMarkRead: updatedStatus.read?.map((it) => it.id),
        },
      });
      */

      inboxCollection.utils.writeBatch(() => {
        updatedStatus.deleted?.forEach((deleted) =>
          inboxCollection.utils.writeDelete(deleted.id),
        );
      });
      //don't refetch
      return { refetch: false };
    },

    queryClient,
    getKey: (it) => it.id,
  }),
);

// oxlint-disable-next-line typescript/explicit-function-return-type
export function useInboxQuery(enabled: Accessor<boolean>) {
  return useLiveQuery((q) => {
    if (!isLoggedIn() || !enabled()) return undefined;
    return q
      .from({ inbox: inboxCollection })
      .orderBy(({ inbox }) => inbox.timestamp, "desc")
      .orderBy(({ inbox }) => inbox.subject, "asc");
  });
}
