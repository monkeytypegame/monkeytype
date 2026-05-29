import { AllRewards, MonkeyMail } from "@monkeytype/schemas/users";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import {
  createCollection,
  createPacedMutations,
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
import {
  showErrorNotification,
  showSuccessNotification,
} from "../states/notifications";
import * as BadgeController from "../controllers/badge-controller";
import { addBadge, addXp } from "../db";

const flushStrategy = flushDebounceStrategy({ maxWait: 1000 * 60 * 5 });
export function applyPendingInboxActions(): void {
  flushStrategy.flush();
}

const queryKeys = {
  root: () => [...baseKey("inbox", { isUserSpecific: true })],
};

const [maxMailboxSize, setMaxMailboxSize] = createSignal(0);

export { maxMailboxSize };
export type InboxItem = Omit<MonkeyMail, "read"> & {
  status: "unclaimed" | "unread" | "read" | "deleted";
};
const inboxCollection = createCollection(
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
          `Error fetching user inbox: ${response.body.message}`,
        );
        throw new Error(`Error fetching user inbox: ${response.body.message}`);
      }
      setMaxMailboxSize(response.body.data.maxMail);
      return response.body.data.inbox.map(addStatus);
    },
    queryClient,
    getKey: (it) => it.id,
  }),
);

export async function refetchInboxCollection(): Promise<void> {
  await inboxCollection.utils.refetch();
}

const inboxItemIdsToClaim: string[] = [];
export const mutateInboxItem = createPacedMutations<
  Pick<InboxItem, "id" | "status">,
  InboxItem
>({
  onMutate: ({ id, status }) => {
    inboxCollection.update(id, (old) => {
      if (old.status === "unclaimed") {
        inboxItemIdsToClaim.push(old.id);
      }
      old.status = status;
    });
  },
  mutationFn: async (changes) => {
    await flushPendingChanges(changes);

    const allRewards: AllRewards[] = changes.transaction.mutations
      .map((it) => it.modified)
      .filter((it) => inboxItemIdsToClaim.includes(it.id))
      .flatMap((it) => it.rewards);
    inboxItemIdsToClaim.length = 0;
    claimRewards(allRewards);
  },
  strategy: flushStrategy.strategy,
});

function claimRewards(pendingRewards: AllRewards[]): void {
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

export function claimAllInboxItems(): void {
  inboxCollection.forEach((it) => {
    if (it.status === "unclaimed") {
      mutateInboxItem({ id: it.id, status: "read" });
    }
  });
}

export function deleteAllInboxItems(): void {
  inboxCollection.forEach((it) => {
    if (it.status === "unread" || it.status === "read") {
      mutateInboxItem({ id: it.id, status: "deleted" });
    }
  });
}

async function flushPendingChanges({
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
      `Error updating user inbox: ${response.body.message}`,
    );
    throw new Error(`Error updating user inbox: ${response.body.message}`);
  }

  inboxCollection.utils.writeBatch(() => {
    updatedStatus.deleted?.forEach((deleted) =>
      inboxCollection.utils.writeDelete(deleted.id),
    );
    updatedStatus.read?.forEach((read) => {
      inboxCollection.utils.writeUpdate(read);
    });
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
