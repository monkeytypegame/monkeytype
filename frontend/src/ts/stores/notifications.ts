import { createStore } from "solid-js/store";

import { CommonResponsesType } from "@monkeytype/contracts/util/api";
import { JSXElement } from "solid-js";

export type NotificationLevel = -1 | 0 | 1;

export type Notification = {
  id: number;
  message: string | JSXElement;
  level: NotificationLevel;
  important: boolean;
  duration: number;
  customTitle?: string;
  customIcon?: string;
  closeCallback?: () => void;
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

const notificationHistory: NotificationHistoryEntry[] = [];
let historyId = 0;

function pushNotification(notification: Omit<Notification, "id">): number {
  const newId = id++;
  setNotifications((prev) => [{ ...notification, id: newId }, ...prev]);
  return newId;
}

export function removeNotification(notificationId: number): void {
  const timer = autoRemoveTimers.get(notificationId);
  if (timer !== undefined) {
    clearTimeout(timer);
    autoRemoveTimers.delete(notificationId);
  }
  const notification = notifications.find((n) => n.id === notificationId);
  notification?.closeCallback?.();
  setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
}

export function clearAllNotifications(): void {
  for (const [, timer] of autoRemoveTimers) {
    clearTimeout(timer);
  }
  autoRemoveTimers.clear();
  for (const notification of notifications) {
    notification.closeCallback?.();
  }
  setNotifications([]);
}

export function getNotifications(): Notification[] {
  return notifications;
}

export function getNotificationHistory(): NotificationHistoryEntry[] {
  return notificationHistory;
}

export type AddNotificationOptions = {
  important?: boolean;
  duration?: number;
  customTitle?: string;
  customIcon?: string;
  closeCallback?: () => void;
  details?: object | string;
  response?: CommonResponsesType;
};

export function addNotification(
  message: string | JSXElement,
  level: NotificationLevel = 0,
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
    if (typeof message === "string") {
      message = message + ": " + options.response.body.message;
    }
  }

  const title =
    options.customTitle ??
    (level === 1 ? "Success" : level === -1 ? "Error" : "Notice");

  notificationHistory.push({
    id: (historyId++).toString(),
    title,
    message: typeof message === "string" ? message : "",
    level,
    details,
  });
  if (notificationHistory.length > 25) {
    notificationHistory.shift();
  }

  let duration: number;
  if (options.duration === undefined) {
    duration = level === -1 ? 0 : 3000;
  } else {
    duration = options.duration * 1000;
  }

  const notifId = pushNotification({
    message,
    level,
    important: options.important ?? false,
    duration,
    customTitle: options.customTitle,
    customIcon: options.customIcon,
    closeCallback: options.closeCallback,
  });

  if (duration > 0) {
    const timer = setTimeout(() => {
      autoRemoveTimers.delete(notifId);
      removeNotification(notifId);
    }, duration + 250);
    autoRemoveTimers.set(notifId, timer);
  }
}
