import { CronJob } from "cron";
import * as db from "../init/db";
import * as Prometheus from "../utils/prometheus";

const CRON_SCHEDULE = "0 0 * * * *";

function main(): void {
  Promise.all([
    set("ape-keys"),
    set("configs"),
    set("errors"),
    set("logs"),
    set("presets"),
    set("reports"),
    set("results"),
    set("users"),
  ]);
}

async function set(collection: string): Promise<void> {
  const size = await db.collection(collection).estimatedDocumentCount();
  Prometheus.setCollectionSize(collection, size);
}

export default new CronJob(CRON_SCHEDULE, main);
