import { CronJob } from "cron";
import * as db from "../init/db";
import * as Prometheus from "../utils/prometheus";

const CRON_SCHEDULE = "0 */5 * * * *";

const collectionsToLog = [
  "ape-keys",
  "configs",
  "errors",
  "logs",
  "presets",
  "reports",
  "results",
  "users",
];

async function main(): Promise<void> {
  await Promise.all(collectionsToLog.map(set));
}

async function set(collection: string): Promise<void> {
  const size = await db.collection(collection).estimatedDocumentCount();
  Prometheus.setCollectionSize(collection, size);
}

export default new CronJob(CRON_SCHEDULE, main);
