import _ from "lodash";
import IORedis from "ioredis";
import { Worker, Job, type ConnectionOptions } from "bullmq";
import Logger from "../utils/logger";
import EmailQueue, {
  type EmailTaskContexts,
  type EmailType,
} from "../queues/email-queue";
import { sendEmail } from "../init/email-client";
import { recordTimeToCompleteJob } from "../utils/prometheus";
import { addLog } from "../dal/logs";

async function jobHandler(job: Job): Promise<void> {
  const type: EmailType = job.data.type;
  const email: string = job.data.email;
  const ctx: EmailTaskContexts[typeof type] = job.data.ctx;

  Logger.info(`Starting job: ${type}`);

  const start = performance.now();

  const result = await sendEmail(type, email, ctx);

  if (!result.success) {
    void addLog("error_sending_email", {
      type,
      email,
      ctx: JSON.stringify(ctx),
      error: result.message,
    });
    throw new Error(result.message);
  }

  const elapsed = performance.now() - start;
  recordTimeToCompleteJob(EmailQueue.queueName, type, elapsed);
  Logger.success(`Job: ${type} - completed in ${elapsed}ms`);
}

export default (redisConnection?: IORedis.Redis): Worker =>
  new Worker(EmailQueue.queueName, jobHandler, {
    autorun: false,
    connection: redisConnection as ConnectionOptions,
  });
