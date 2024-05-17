import { CronJob } from "cron";
import Queues from "../queues/index";
import { setQueueLength } from "../utils/prometheus";

const CRON_SCHEDULE = "0 */5 * * * *";

async function main(): Promise<void> {
  await Promise.all(Queues.map(async (queue) => {
    const counts = await queue.getJobCounts();
    const waitingTotal = (counts["waiting"] ?? 0) + (counts["paused"] ?? 0) + (counts["delayed"] ?? 0) + (counts["waiting-children"] ?? 0);
    ["completed", "active", "failed"].forEach(status => setQueueLength(queue.queueName, status, counts[status] ?? 0));
    setQueueLength(queue.queueName, "waiting", waitingTotal);
  }));
}

export default new CronJob(CRON_SCHEDULE, main);
