import { MonkeyMail } from "@monkeytype/schemas/users";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import {
  createCollection,
  eq,
  MutationFnParams,
  not,
  useLiveQuery,
} from "@tanstack/solid-db";
import { Accessor, createSignal } from "solid-js";
import Ape from "../ape";
import { queryClient } from "../queries";
import { baseKey } from "../queries/utils/keys";
import { isAuthenticated } from "../states/core";
import { flushDebounceStrategy } from "./utils/flushDebounceStrategy";
import { showErrorNotification } from "../states/notifications";

export const flushStrategy = flushDebounceStrategy({ maxWait: 1000 * 60 * 5 });

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
        showErrorNotification(
          "Error fetching user inbox: " + response.body.message,
        );
        throw new Error("Error fetching user inbox: " + response.body.message);
      }
      setMaxMailboxSize(response.body.data.maxMail);
      return response.body.data.inbox.map(addStatus);
    },
    queryClient,
    getKey: (it) => it.id,
  }),
);

export async function flushPendingChanges({
  transaction,
}: MutationFnParams<InboxItem>): Promise<unknown> {
  const updatedStatus = Object.groupBy(
    transaction.mutations.map((it) => it.modified),
    (it) => it.status,
  );

  const response = await Ape.users.updateInbox({
    body: {
      mailIdsToMarkRead: updatedStatus.read?.map((it) => it.id),
      mailIdsToDelete: updatedStatus.deleted?.map((it) => it.id),
    },
  });

  if (response.status !== 200) {
    showErrorNotification(
      "Error updating user inbox: " + response.body.message,
    );
    throw new Error("Error updating user inbox: " + response.body.message);
  }

  inboxCollection.utils.writeBatch(() => {
    updatedStatus.deleted?.forEach((deleted) =>
      inboxCollection.utils.writeDelete(deleted.id),
    );
  });

  return { refetch: false };
}

// oxlint-disable-next-line typescript/explicit-function-return-type
export function useInboxQuery(enabled: Accessor<boolean>) {
  return useLiveQuery((q) => {
    if (!isAuthenticated() || !enabled()) return undefined;
    return q
      .from({ inbox: inboxCollection })
      .where(({ inbox }) => not(eq(inbox.status, "deleted")))
      .orderBy(({ inbox }) => inbox.timestamp, "desc")
      .orderBy(({ inbox }) => inbox.subject, "asc");
  });
}
