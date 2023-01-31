import _ from "lodash";
import IORedis from "ioredis";
import { Worker, Job } from "bullmq";
import Logger from "../utils/logger";
import EmailQueue, { EmailTask } from "../queues/email-queue";
import { fillTemplate, sendMail } from "../utils/email";

async function jobHandler(job: Job): Promise<void> {
  const { type, email, args }: EmailTask = job.data;
  Logger.info(`Starting job: ${type}`);

  const start = performance.now();

  if (type === "verify") {
    const html = await fillTemplate("verify", args);
    await sendMail(email, "Verify your Monkeytype account", html);
  }

  const elapsed = performance.now() - start;

  Logger.success(`Job: ${type} - completed in ${elapsed}ms`);
}

export default (redisConnection?: IORedis.Redis): Worker =>
  new Worker(EmailQueue.queueName, jobHandler, {
    autorun: false,
    connection: redisConnection,
  });
