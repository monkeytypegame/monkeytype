import { createStore } from "solid-js/store";

import { CommonResponsesType } from "@monkeytype/contracts/util/api";
import { createErrorMessage } from "../utils/misc";

export type NotificationLevel = "error" | "notice" | "success";

export type Notification = {
  id: number;
  message: string;
  level: NotificationLevel;
  important: boolean;
  durationMs: number;
  useInnerHtml: boolean;
  customTitle?: string;
  customIcon?: string;
  onDismiss?: (reason: "click" | "timeout" | "clear") => void;
};

export type NotificationHistoryEntry = {
  id: string;
  title: string;
  message: string;
  level: NotificationLevel;
  details?: string | object;
};

let id = 0;
const [notifications, setNotifications] = createStore<Notification[]>([]);
const autoRemoveTimers = new Map<number, ReturnType<typeof setTimeout>>();

const [notificationHistory, setNotificationHistory] = createStore<
  NotificationHistoryEntry[]
>([]);
let historyId = 0;

function addNotificationToStore(
  notification: Omit<Notification, "id">,
): number {
  const newId = id++;
  setNotifications((prev) => [{ ...notification, id: newId }, ...prev]);
  return newId;
}

export function removeNotification(
  notificationId: number,
  reason: "click" | "timeout" | "clear" = "click",
): void {
  const timer = autoRemoveTimers.get(notificationId);
  if (timer !== undefined) {
    clearTimeout(timer);
    autoRemoveTimers.delete(notificationId);
  }
  const notification = notifications.find((n) => n.id === notificationId);
  notification?.onDismiss?.(reason);
  setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
}

export function clearAllNotifications(): void {
  for (const [, timer] of autoRemoveTimers) {
    clearTimeout(timer);
  }
  autoRemoveTimers.clear();
  for (const notification of notifications) {
    notification.onDismiss?.("clear");
  }
  setNotifications([]);
}

export function getNotifications(): Notification[] {
  return notifications;
}

export function getNotificationHistory(): NotificationHistoryEntry[] {
  return notificationHistory;
}

export type AddNotificationOptions = Partial<
  Pick<
    Notification,
    | "important"
    | "durationMs"
    | "customTitle"
    | "customIcon"
    | "onDismiss"
    | "useInnerHtml"
  >
> & {
  details?: object | string;
  response?: CommonResponsesType;
  error?: unknown;
};

export function addNotificationWithLevel(
  message: string,
  level: NotificationLevel,
  options: AddNotificationOptions = {},
): void {
  let details = options.details;

  if (options.response !== undefined) {
    details = {
      status: options.response.status,
      additionalDetails: options.details,
      validationErrors:
        options.response.status === 422
          ? options.response.body.validationErrors
          : undefined,
    };
    message = message + ": " + options.response.body.message;
  }

  if (options.error !== undefined) {
    message = createErrorMessage(options.error, message);
  }

  const title =
    options.customTitle ??
    (level === "success" ? "Success" : level === "error" ? "Error" : "Notice");

  setNotificationHistory((prev) => {
    const next = [
      ...prev,
      {
        id: (historyId++).toString(),
        title,
        message,
        level,
        details,
      },
    ];
    return next.length > 25 ? next.slice(-25) : next;
  });

  const durationMs = options.durationMs ?? (level === "error" ? 0 : 3000);

  const notifId = addNotificationToStore({
    message,
    level,
    important: options.important ?? false,
    durationMs,
    useInnerHtml: options.useInnerHtml ?? false,
    customTitle: options.customTitle,
    customIcon: options.customIcon,
    onDismiss: options.onDismiss,
  });

  if (durationMs > 0) {
    const timer = setTimeout(() => {
      autoRemoveTimers.delete(notifId);
      removeNotification(notifId, "timeout");
    }, durationMs + 250);
    autoRemoveTimers.set(notifId, timer);
  }
}

export function notify(
  message: string,
  options?: AddNotificationOptions,
): void {
  addNotificationWithLevel(message, "notice", options);
}

export function notifySuccess(
  message: string,
  options?: AddNotificationOptions,
): void {
  addNotificationWithLevel(message, "success", options);
}

export function notifyError(
  message: string,
  options?: AddNotificationOptions,
): void {
  addNotificationWithLevel(message, "error", options);
}
