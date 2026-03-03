import { formatDistanceToNowStrict } from "date-fns/formatDistanceToNowStrict";
import { For, JSXElement, Show } from "solid-js";

import {
  inboxCollection,
  InboxItem,
  maxMailboxSize,
  useInboxQuery,
} from "../../../collections/inbox";
import { getModalVisibility } from "../../../stores/modals";
import AsyncContent from "../../common/AsyncContent";
import { Button } from "../../common/Button";
import { Fa } from "../../common/Fa";
import { H2 } from "../../common/Headers";

export function Inbox(): JSXElement {
  const inboxQuery = useInboxQuery(
    () => getModalVisibility("Alerts")?.visible ?? false,
  );

  const updateInbox = (options: {
    from: InboxItem["status"];
    to: InboxItem["status"];
  }): void => {
    const ids: string[] = [];
    inboxCollection.forEach((it) => {
      if (it.status === options.from) ids.push(it.id);
    });
    if (ids.length > 0) {
      inboxCollection.update(ids, (list) =>
        list.forEach((it) => (it.status = options.to)),
      );
    }
  };
  return (
    <AsyncContent collection={inboxQuery}>
      {(inbox) => (
        <>
          <div class="flex flex-row">
            <H2 fa={{ icon: "fa-inbox" }} text="Inbox" class="text-lg" />
            <div class="ml-auto text-lg text-sub">
              {inbox.length}/{maxMailboxSize()}
            </div>
          </div>
          <Show when={inboxQuery().some((it) => it.status === "unclaimed")}>
            <Button
              fa={{ icon: "fa-gift", fixedWidth: true }}
              text="Claim all"
              onClick={() => updateInbox({ from: "unclaimed", to: "read" })}
            />
          </Show>
          <Show when={inboxQuery().some((it) => it.status === "read")}>
            <Button
              fa={{ icon: "fa-trash", fixedWidth: true }}
              text="Delete all"
              onClick={() => updateInbox({ from: "read", to: "deleted" })}
            />
          </Show>

          <For each={inbox} fallback="Nothing to show">
            {(entry) => <Entry entry={entry} />}
          </For>
        </>
      )}
    </AsyncContent>
  );
}

function Entry(props: { entry: InboxItem }): JSXElement {
  return (
    <div class="grid grid-cols-[0.25rem_auto_max-content] gap-x-2 gap-y-4 [&>div>button]:opacity-0 hover:[&>div>button]:opacity-100">
      <div
        classList={{
          "bg-main": props.entry.status !== "read",
          "bg-sub-alt": props.entry.status === "read",
        }}
      ></div>
      <div class="flex flex-col gap-1">
        <div class="text-[0.6rem] text-sub opacity-50">
          {formatDistanceToNowStrict(props.entry.timestamp)} ago
        </div>
        <div class="text-sub">{props.entry.subject}</div>
        <div>{props.entry.body}</div>
        <Show when={props.entry.status === "unclaimed"}>
          <div>
            <Fa icon="fa-gift" fixedWidth />
            {props.entry.rewards.length}
          </div>
        </Show>
      </div>
      <div class="content-center">
        <Show when={props.entry.status === "unclaimed"}>
          <Button
            type="text"
            fa={{ icon: "fa-gift", fixedWidth: true }}
            ariaLabel={{ text: "Claim", position: "left" }}
            onClick={() =>
              inboxCollection.update(
                props.entry.id,
                (it) => (it.status = "read"),
              )
            }
          />
        </Show>

        <Show
          when={
            props.entry.status !== "unclaimed" &&
            props.entry.status !== "deleted"
          }
        >
          <Button
            type="text"
            fa={{ icon: "fa-trash", fixedWidth: true }}
            ariaLabel={{ text: "Delete", position: "left" }}
            onClick={() =>
              inboxCollection.update(
                props.entry.id,
                (it) => (it.status = "deleted"),
              )
            }
          />
        </Show>
      </div>
    </div>
  );
}
