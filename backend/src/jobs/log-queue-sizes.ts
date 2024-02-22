import { CronJob } from "cron";
import Queues from "../queues/index";
import { setQueueLength } from "../utils/prometheus";

const CRON_SCHEDULE = "0 */5 * * * *";

async function main(): Promise<void> {
  await Promise.all(
    Queues.map(async (queue) => {
      const counts = await queue.getJobCounts();

      const active = counts["active"] ?? 0;
      const completed = counts["completed"] ?? 0;
      const failed = counts["failed"] ?? 0;

      const waiting = counts["waiting"] ?? 0;
      const paused = counts["paused"] ?? 0;
      const delayed = counts["delayed"] ?? 0;
      const waitingChildren = counts["waiting-children"] ?? 0;

      const waitingTotal = waiting + paused + delayed + waitingChildren;

      setQueueLength(queue.queueName, "completed", completed);
      setQueueLength(queue.queueName, "active", active);
      setQueueLength(queue.queueName, "failed", failed);
      setQueueLength(queue.queueName, "waiting", waitingTotal);
    })
  );
}

export default new CronJob(CRON_SCHEDULE, main);
