import { For, JSXElement, Show } from "solid-js";

import {
  getNotificationHistory,
  NotificationHistoryEntry,
  NotificationLevel,
} from "../../../states/notifications";
import { cn } from "../../../utils/cn";
import { Button } from "../../common/Button";
import { Conditional } from "../../common/Conditional";
import { H3 } from "../../common/Headers";
import { AlertsSection } from "./AlertsSection";

function levelClass(level: NotificationLevel): string {
  if (level === "error") return "bg-error";
  if (level === "success") return "bg-main";
  return "bg-sub";
}

async function copyDetails(
  notification: NotificationHistoryEntry,
): Promise<void> {
  const data = {
    title: notification.title,
    message: notification.message,
    details: notification.details,
  };
  try {
    const text = JSON.stringify(data, null, 2);
    await navigator.clipboard.writeText(text);
    window.alert("Copied notification details to clipboard.");
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to copy notification details:", error);
    window.alert("Failed to copy notification details.");
  }
}

export function NotificationHistory(): JSXElement {
  const reversed = (): NotificationHistoryEntry[] =>
    [...getNotificationHistory()].reverse();

  return (
    <AlertsSection
      title={<H3 fa={{ icon: "fa-comment-alt" }} text="Notifications" />}
      body={
        <Show
          when={getNotificationHistory().length > 0}
          fallback={<div class="place-self-center">Nothing to show</div>}
        >
          <div class="flex w-full flex-col content-start gap-4 place-self-start">
            <For each={reversed()}>
              {(notification) => (
                <NotificationEntry notification={notification} />
              )}
            </For>
          </div>
        </Show>
      }
    />
  );
}

function NotificationEntry(props: {
  notification: NotificationHistoryEntry;
}): JSXElement {
  return (
    <div class="grid h-min w-full grid-cols-[0.25rem_auto_max-content] gap-x-2 gap-y-1 [&_.buttons]:opacity-0 focus-within:[&_.buttons]:opacity-100 hover:[&_.buttons]:opacity-100">
      <div
        class={cn(
          "row-span-2 h-full w-1 rounded-sm transition-colors duration-125",
          levelClass(props.notification.level),
        )}
      ></div>
      <div class="text-xs text-sub">{props.notification.title}</div>
      <div class="buttons row-span-2 grid content-center gap-2 transition-opacity duration-125">
        <Show when={props.notification.details !== undefined}>
          <Button
            variant="text"
            fa={{ icon: "fa-clipboard", fixedWidth: true }}
            balloon={{
              text: "Copy details to clipboard",
              position: "left",
            }}
            onClick={() => void copyDetails(props.notification)}
          />
        </Show>
      </div>
      <Conditional
        if={props.notification.useInnerHtml}
        then={
          <div
            class="text-xs wrap-break-word text-text"
            // oxlint-disable-next-line solid/no-innerhtml
            innerHTML={props.notification.message}
          ></div>
        }
        else={
          <div class="text-xs wrap-break-word text-text">
            {props.notification.message}
          </div>
        }
      />
    </div>
  );
}
