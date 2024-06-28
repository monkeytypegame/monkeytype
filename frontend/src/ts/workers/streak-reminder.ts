// worker instance
const workerInstance = new ComlinkWorker<
  typeof import("./streak-reminder-worker")
>(new URL("./streak-reminder-worker", import.meta.url));

export type StreakReminderConfig = {
  streakOffset?: number;
  reminderHours?: number;
};
export async function updateStreakOffset(): Promise<void> {
  await workerInstance.setStreakOffset(5);
}
export async function init(config: StreakReminderConfig): Promise<void> {
  await workerInstance.init(config);
}
