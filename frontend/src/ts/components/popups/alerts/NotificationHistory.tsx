import { For, JSXElement, Show } from "solid-js";

import { AlertNotification, getNotifications } from "../../../stores/alerts";
import { cn } from "../../../utils/cn";
import { Button } from "../../common/Button";
import { H2 } from "../../common/Headers";

function levelClass(level: number): string {
  if (level === -1) return "bg-error";
  if (level === 1) return "bg-main";
  return "bg-sub";
}

async function copyDetails(notification: AlertNotification): Promise<void> {
  const data = {
    title: notification.title,
    message: notification.message,
    details: notification.details,
  };
  await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
}

export function NotificationHistory(): JSXElement {
  const reversed = (): AlertNotification[] => [...getNotifications()].reverse();

  return (
    <div>
      <H2
        fa={{ icon: "fa-comment-alt" }}
        text="Notifications"
        class="text-lg"
      />
      <Show
        when={getNotifications().length > 0}
        fallback={
          <div class="my-8 text-center text-xs text-text">Nothing to show</div>
        }
      >
        <div class="grid gap-4">
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
                      type="text"
                      fa={{ icon: "fa-clipboard", fixedWidth: true }}
                      ariaLabel={{
                        text: "Copy details to clipboard",
                        position: "left",
                      }}
                      onClick={() => void copyDetails(notification)}
                    />
                  </Show>
                </div>
                <div class="text-xs wrap-break-word text-text">
                  {notification.message}
                </div>
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}
