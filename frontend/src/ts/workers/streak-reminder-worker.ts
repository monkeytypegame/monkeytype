import { addHours } from "date-fns";
import { StreakReminderConfig } from "./streak-reminder";

let timeout: NodeJS.Timeout | undefined = undefined;
let notification: Notification | undefined;
let streakDate: Date | undefined;

export function init(config: StreakReminderConfig): void {
  if (config.reminderHours === undefined) {
    streakDate = undefined;
    notification?.close();
    if (timeout !== undefined) clearTimeout(timeout);
    stopPolling();
    return;
  }

  timeout = setTimeout(
    startPolling,
    getStartDate(config.reminderHours, config.streakOffset) - Date.now()
  );
}

export function setStreakOffset(offset: number): void {
  console.log("#### set offset", offset);
  if (timeout === undefined) {
    timeout = setTimeout(notify, 10_000);
  }
}

console.log("#### load worker");

function notify(): void {
  if (notification === undefined && Notification.permission === "granted") {
    notification = new Notification("Streak Reminder", {
      body: "Your streak will be lost in <2 hours. Why not hop on monkeytype.com and do a test?",
      icon: "/images/icons/general_icon_x512.png",
    });
  }
}

function startPolling(): void {}

function stopPolling(): void {}

function getStartDate(reminderHours: number, streakOffset?: number): number {
  const date = new Date();
  date.setUTCHours(24);
  date.setUTCMinutes(0);
  date.setUTCSeconds(0);
  date.setUTCMilliseconds(0);

  const utcDate = addHours(date, streakOffset ?? 0);
  //utcDate = subHours(utcDate, reminderHours);

  console.log("polling will start at", utcDate, utcDate.valueOf());

  return utcDate.valueOf();
}
