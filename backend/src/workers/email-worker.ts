import _ from "lodash";
import IORedis from "ioredis";
import { Worker, Job } from "bullmq";
import Logger from "../utils/logger";
import EmailQueue, {
  EmailTaskContexts,
  EmailType,
} from "../queues/email-queue";
import { sendMailUsingTemplate } from "../init/email-client";

async function jobHandler(job: Job): Promise<void> {
  const type: EmailType = job.data.type;
  const email: string = job.data.email;
  const ctx: EmailTaskContexts[typeof type] = job.data.ctx;

  Logger.info(`Starting job: ${type}`);

  const start = performance.now();

  if (type === "verify") {
    await sendMailUsingTemplate(
      type,
      email,
      "Verify your Monkeytype account",
      ctx
    );
  }

  const elapsed = performance.now() - start;

  Logger.success(`Job: ${type} - completed in ${elapsed}ms`);
}

export default (redisConnection?: IORedis.Redis): Worker =>
  new Worker(EmailQueue.queueName, jobHandler, {
    autorun: false,
    connection: redisConnection,
  });
