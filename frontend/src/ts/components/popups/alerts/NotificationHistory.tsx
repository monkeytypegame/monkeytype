import { For, JSXElement, Show } from "solid-js";

import {
  getNotificationHistory,
  NotificationHistoryEntry,
  NotificationLevel,
} from "../../../stores/notifications";
import { cn } from "../../../utils/cn";
import { Button } from "../../common/Button";
import { Conditional } from "../../common/Conditional";
import { H3 } from "../../common/Headers";

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
  await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
}

export function NotificationHistory(): JSXElement {
  const reversed = (): NotificationHistoryEntry[] =>
    [...getNotificationHistory()].reverse();

  return (
    <div>
      <H3
        fa={{ icon: "fa-comment-alt" }}
        text="Notifications"
        class="text-xl"
      />
      <Show
        when={getNotificationHistory().length > 0}
        fallback={
          <div class="grid min-h-20 place-items-center">
            <div>Nothing to show</div>
          </div>
        }
      >
        <div class="grid min-h-20 gap-4">
          <For each={reversed()}>
            {(notification) => (
              <div class="grid grid-cols-[0.25rem_auto_max-content] gap-x-2 gap-y-1 [&_.buttons]:opacity-0 focus-within:[&_.buttons]:opacity-100 hover:[&_.buttons]:opacity-100">
                <div
                  class={cn(
                    "row-span-2 h-full w-1 rounded-sm transition-colors duration-125",
                    levelClass(notification.level),
                  )}
                ></div>
                <div class="text-xs text-sub">{notification.title}</div>
                <div class="buttons row-span-2 grid content-center gap-2 transition-opacity duration-125">
                  <Show when={notification.details !== undefined}>
                    <Button
                      variant="text"
                      fa={{ icon: "fa-clipboard", fixedWidth: true }}
                      balloon={{
                        text: "Copy details to clipboard",
                        position: "left",
                      }}
                      onClick={() => void copyDetails(notification)}
                    />
                  </Show>
                </div>
                <Conditional
                  if={notification.useInnerHtml}
                  then={
                    <div
                      class="text-xs wrap-break-word text-text"
                      // oxlint-disable-next-line solid/no-innerhtml
                      innerHTML={notification.message}
                    ></div>
                  }
                  else={
                    <div class="text-xs wrap-break-word text-text">
                      {notification.message}
                    </div>
                  }
                />
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}
