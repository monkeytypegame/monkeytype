import { MonkeyQueue } from "./monkey-queue";

const QUEUE_NAME = "mail-tasks";

export type EmailType = "verify";

export interface EmailTask {
  type: "verify";
  email: string;
  args: any[];
}

function buildTask(
  taskName: EmailType,
  email: string,
  taskArgs: any[]
): EmailTask {
  return {
    type: taskName,
    email: email,
    args: taskArgs,
  };
}

class EmailQueue extends MonkeyQueue<EmailTask> {
  async sendVerificationEmail(
    email: string,
    name: string,
    link: number
  ): Promise<void> {
    const taskName = "verify";
    const task = buildTask(taskName, email, [name, link]);
    await this.add(taskName, task);
  }
}

export default new EmailQueue(QUEUE_NAME, {
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: true,
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
  },
});
