import { baseKey } from "../queries/utils/keys";
import { createCollection, useLiveQuery } from "@tanstack/solid-db";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import Ape from "../ape";
import * as BadgeController from "../controllers/badge-controller";
import { addBadge, addXp } from "../db";
import { queryClient } from "../queries";
import { isLoggedIn } from "../signals/core";
import { showSuccessNotification } from "../stores/notifications";
import { AllRewards, MonkeyMail } from "@monkeytype/schemas/users";
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

      // Queue API updates — flushed when the alerts modal closes
      if (updatedStatus.read !== undefined) {
        pendingMarkRead.push(...updatedStatus.read.map((it) => it.id));
      }
      if (updatedStatus.deleted !== undefined) {
        pendingDelete.push(...updatedStatus.deleted.map((it) => it.id));
      }

      // Queue rewards — flushed when the alerts modal closes
      const claimed = transaction.mutations.filter(
        (it) =>
          it.original.status === "unclaimed" && it.modified.status === "read",
      );
      pendingRewards.push(...claimed.flatMap((it) => it.original.rewards));

      inboxCollection.utils.writeBatch(() => {
        updatedStatus.deleted?.forEach((deleted) =>
          inboxCollection.utils.writeDelete(deleted.id),
        );
      });

      return { refetch: false };
    },

    queryClient,
    getKey: (it) => it.id,
  }),
);

const pendingRewards: AllRewards[] = [];
const pendingMarkRead: string[] = [];
const pendingDelete: string[] = [];

export function flushPendingInbox(): void {
  // Send batched API update
  if (pendingMarkRead.length > 0 || pendingDelete.length > 0) {
    void Ape.users.updateInbox({
      body: {
        mailIdsToMarkRead:
          pendingMarkRead.length > 0 ? [...pendingMarkRead] : undefined,
        mailIdsToDelete:
          pendingDelete.length > 0 ? [...pendingDelete] : undefined,
      },
    });
    pendingMarkRead.length = 0;
    pendingDelete.length = 0;
  }

  if (pendingRewards.length === 0) return;

  let totalXp = 0;
  const badgeNames: string[] = [];

  for (const reward of pendingRewards) {
    if (reward.type === "xp") {
      totalXp += reward.item;
    } else if (reward.type === "badge") {
      const badge = BadgeController.getById(reward.item.id);
      if (badge) {
        badgeNames.push(badge.name);
        addBadge(reward.item);
      }
    }
  }

  pendingRewards.length = 0;

  if (totalXp > 0) {
    addXp(totalXp);
  }

  if (badgeNames.length > 0) {
    showSuccessNotification(
      `New badge${badgeNames.length > 1 ? "s" : ""} unlocked: ${badgeNames.join(", ")}`,
      { durationMs: 5000, customTitle: "Reward", customIcon: "gift" },
    );
  }
}

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
