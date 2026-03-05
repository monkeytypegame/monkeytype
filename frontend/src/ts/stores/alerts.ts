import { createStore } from "solid-js/store";

import * as NotificationEvent from "../observables/notification-event";

export type AlertNotification = {
  id: string;
  title: string;
  message: string;
  level: number;
  details?: string | object;
};

export type AlertPsa = {
  message: string;
  level: number;
};

let notificationId = 0;

const [notifications, setNotifications] = createStore<AlertNotification[]>([]);
const [psas, setPsas] = createStore<AlertPsa[]>([]);

export function addNotification(
  notification: Omit<AlertNotification, "id">,
): void {
  setNotifications((prev) => {
    const next = [
      ...prev,
      { ...notification, id: (notificationId++).toString() },
    ];
    if (next.length > 25) {
      next.shift();
    }
    return next;
  });
}

export function getNotifications(): AlertNotification[] {
  return notifications;
}

export function addPsa(message: string, level: number): void {
  setPsas((prev) => [...prev, { message, level }]);
}

export function getPsas(): AlertPsa[] {
  return psas;
}

NotificationEvent.subscribe((message, level, options) => {
  let title = "Notice";
  if (level === -1) {
    title = "Error";
  } else if (level === 1) {
    title = "Success";
  }
  if (options.customTitle !== undefined) {
    title = options.customTitle;
  }

  addNotification({ title, message, level, details: options.details });
});
