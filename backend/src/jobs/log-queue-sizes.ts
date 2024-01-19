import { CronJob } from "cron";
import Queues from "../queues/index";
import { setQueueLength } from "../utils/prometheus";

const CRON_SCHEDULE = "0 */5 * * * *";

async function main(): Promise<void> {
  Promise.all(
    Queues.map(async (queue) => {
      const counts = await queue.getJobCounts();

      const active = counts["active"];
      const completed = counts["completed"];
      const failed = counts["failed"];

      const waiting = counts["waiting"];
      const paused = counts["paused"];
      const delayed = counts["delayed"];
      const waitingChildren = counts["waiting-children"];

      const waitingTotal = waiting + paused + delayed + waitingChildren;

      setQueueLength(queue.queueName, "completed", completed);
      setQueueLength(queue.queueName, "active", active);
      setQueueLength(queue.queueName, "failed", failed);
      setQueueLength(queue.queueName, "waiting", waitingTotal);
    })
  );
}

export default new CronJob(CRON_SCHEDULE, main);
