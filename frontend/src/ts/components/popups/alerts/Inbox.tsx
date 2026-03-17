import { AllRewards } from "@monkeytype/schemas/users";
import { createPacedMutations } from "@tanstack/solid-db";
import { formatDistanceToNowStrict } from "date-fns/formatDistanceToNowStrict";
import { createEffect, For, JSXElement, Show } from "solid-js";

import {
  flushPendingChanges,
  flushStrategy,
  inboxCollection,
  InboxItem,
  maxMailboxSize,
  useInboxQuery,
} from "../../../collections/inbox";
import * as BadgeController from "../../../controllers/badge-controller";
import { addBadge, addXp, updateInboxUnreadSize } from "../../../db";
import { getModalVisibility } from "../../../states/modals";
import { showSuccessNotification } from "../../../states/notifications";
import { cn } from "../../../utils/cn";
import AsyncContent from "../../common/AsyncContent";
import { Button } from "../../common/Button";
import { Fa } from "../../common/Fa";
import { H3 } from "../../common/Headers";
import { LoadingCircle } from "../../common/LoadingCircle";
import { AlertsSection } from "./AlertsSection";

const inboxItemIdsToClaim: string[] = [];
export function Inbox(): JSXElement {
  const inboxQuery = useInboxQuery(
    () => getModalVisibility("Alerts")?.visible ?? false,
  );

  const claimRewards = (pendingRewards: AllRewards[]) => {
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
  };

  createEffect(() => {
    const items = inboxQuery();
    const count = items.filter(
      (it) => it.status === "unclaimed" || it.status === "unread",
    ).length;
    updateInboxUnreadSize(count);
  });

  const mutate = createPacedMutations<
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

  const updateInbox = (options: {
    from: InboxItem["status"][];
    to: InboxItem["status"];
  }): void => {
    inboxCollection.forEach((it) => {
      if (options.from.includes(it.status)) {
        mutate({ id: it.id, status: options.to });
      }
    });
  };

  const inboxSize = () => inboxQuery().length;

  return (
    <AlertsSection
      title={
        <>
          <H3 fa={{ icon: "fa-inbox" }} text="Inbox" />
          <InboxCounter
            size={inboxSize()}
            maxSize={maxMailboxSize()}
            show={!inboxQuery.isLoading}
          />
        </>
      }
      body={
        <AsyncContent
          collection={inboxQuery}
          loader={<LoadingCircle class="place-self-center text-lg" />}
        >
          {(inbox) => (
            <>
              <Show when={inboxQuery().some((it) => it.status === "unclaimed")}>
                <Button
                  fa={{ icon: "fa-gift", fixedWidth: true }}
                  text="Claim all"
                  onClick={() =>
                    updateInbox({ from: ["unclaimed"], to: "read" })
                  }
                />
              </Show>
              <Show
                when={
                  inboxQuery().length > 0 &&
                  inboxQuery().every(
                    (it) => it.status === "read" || it.status === "unread",
                  )
                }
              >
                <Button
                  fa={{ icon: "fa-trash", fixedWidth: true }}
                  text="Delete all"
                  onClick={() =>
                    updateInbox({ from: ["read", "unread"], to: "deleted" })
                  }
                />
              </Show>

              <For
                each={inbox}
                fallback={<div class="place-self-center">Nothing to show</div>}
              >
                {(entry) => <Entry entry={entry} mutate={mutate} />}
              </For>
            </>
          )}
        </AsyncContent>
      }
    />
  );
}

function InboxCounter(props: {
  size: number;
  maxSize: number;
  show: boolean;
}): JSXElement {
  return (
    <div
      class={cn(
        "grow text-right text-sub",
        !props.show && "hidden",
        props.size >= props.maxSize && "text-error",
      )}
    >
      {props.size}/{props.maxSize}
    </div>
  );
}

function Entry(props: {
  entry: InboxItem;
  mutate: (args: { id: string; status: InboxItem["status"] }) => void;
}): JSXElement {
  return (
    <div class="grid grid-cols-[0.25rem_auto_max-content] gap-x-2 gap-y-4 [&>div>button]:opacity-0 hover:[&>div>button]:opacity-100">
      <div
        class={cn("rounded-full", {
          "bg-main": props.entry.status !== "read",
          "bg-sub-alt": props.entry.status === "read",
        })}
      ></div>
      <div class="flex flex-col gap-1">
        <div class="text-em-sm text-sub opacity-50">
          {formatDistanceToNowStrict(props.entry.timestamp)} ago
        </div>
        <div class="text-sub">{props.entry.subject}</div>
        <div>{props.entry.body}</div>
        <Show when={props.entry.status === "unclaimed"}>
          <div
            class={cn(
              "flex items-baseline gap-1",
              // "bg-sub-alt w-max px-2 py-1 rounded",
            )}
          >
            <Fa icon="fa-gift" fixedWidth />
            {props.entry.rewards.length}
          </div>
        </Show>
      </div>
      <div class="content-center">
        <Show when={props.entry.status === "unclaimed"}>
          <Button
            variant="text"
            fa={{ icon: "fa-gift", fixedWidth: true }}
            balloon={{ text: "Claim", position: "left" }}
            onClick={() => {
              props.mutate({ id: props.entry.id, status: "read" });
            }}
          />
        </Show>

        <Show when={props.entry.status !== "unclaimed"}>
          <Button
            variant="text"
            fa={{ icon: "fa-trash", fixedWidth: true }}
            balloon={{ text: "Delete", position: "left" }}
            onClick={() =>
              props.mutate({ id: props.entry.id, status: "deleted" })
            }
          />
        </Show>
      </div>
    </div>
  );
}
