import { MonkeyMail } from "@monkeytype/schemas/users";
import { formatDistanceToNowStrict } from "date-fns/formatDistanceToNowStrict";
import { For, JSXElement, Show } from "solid-js";

import { useInboxQuery } from "../../../collections/inbox";
import AsyncContent from "../../common/AsyncContent";
import { Button } from "../../common/Button";
import { Fa } from "../../common/Fa";
import { H2 } from "../../common/Headers";

export function Inbox(): JSXElement {
  const inboxQuery = useInboxQuery();
  return (
    <AsyncContent collection={inboxQuery}>
      {(inbox) => (
        <>
          <div>
            <H2 fa={{ icon: "fa-inbox" }} text="Inbox" class="text-lg" />
          </div>
          <Button
            fa={{ icon: "fa-gift", fixedWidth: true }}
            text="Claim all"
            onClick={() => {
              //
            }}
          />
          <Button
            fa={{ icon: "fa-trash", fixedWidth: true }}
            text="Delete all"
            onClick={() => {
              //
            }}
          />

          <For each={inbox} fallback="Nothing to show">
            {(entry) => <Entry entry={entry} />}
          </For>
        </>
      )}
    </AsyncContent>
  );
}

function Entry(props: { entry: MonkeyMail }): JSXElement {
  const hasUnclaimedReward = () =>
    !props.entry.read && props.entry.rewards.length > 0;

  return (
    <div class="grid grid-cols-[0.25rem_auto_max-content] gap-x-2 gap-y-4 [&>div>button]:opacity-0 hover:[&>div>button]:opacity-100">
      <div
        classList={{
          "bg-main": !props.entry.read,
          "bg-sub-alt": props.entry.read,
        }}
      ></div>
      <div class="flex flex-col gap-1">
        <div class="text-[0.6rem] text-sub opacity-50">
          {formatDistanceToNowStrict(props.entry.timestamp)} ago
        </div>
        <div class="text-sub">{props.entry.subject}</div>
        <div>{props.entry.body}</div>
        <Show when={hasUnclaimedReward()}>
          <div>
            <Fa icon="fa-gift" fixedWidth />
            {props.entry.rewards.length}
          </div>
        </Show>
      </div>
      <div class="content-center">
        <Show when={hasUnclaimedReward()}>
          <Button
            type="text"
            fa={{ icon: "fa-gift", fixedWidth: true }}
            ariaLabel={{ text: "Claim", position: "left" }}
            onClick={() => {
              //
            }}
          />
        </Show>

        <Show
          when={
            (props.entry.rewards.length > 0 && props.entry.read) ||
            props.entry.rewards.length === 0
          }
        >
          <Button
            type="text"
            fa={{ icon: "fa-trash", fixedWidth: true }}
            ariaLabel={{ text: "Delete", position: "left" }}
            onClick={() => {
              //
            }}
          />
        </Show>
      </div>
    </div>
  );
}
