export type Message = {
  type: MessageType;
  data?: object;
};

export type StreakReminderConfig = {
  streakOffset?: number;
  reminderHours?: number;
};

export type MessageType = "init" | "test";

export function init(config: StreakReminderConfig): void {
  postMessage("init", config);
  postMessage("test");
}

function postMessage(type: MessageType, payload?: object): void {
  //@ts-expect-error
  navigator.serviceWorker.controller.postMessage({
    type,
    ...payload,
  });
}
