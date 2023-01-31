import { MonkeyQueue } from "./monkey-queue";

const QUEUE_NAME = "email-tasks";

function buildTask(
  taskName: MonkeyTypes.EmailType,
  email: string,
  taskContext: MonkeyTypes.EmailTaskContexts[MonkeyTypes.EmailType]
): MonkeyTypes.EmailTask<MonkeyTypes.EmailType> {
  return {
    type: taskName,
    email: email,
    ctx: taskContext,
  };
}

class EmailQueue extends MonkeyQueue<
  MonkeyTypes.EmailTask<MonkeyTypes.EmailType>
> {
  async sendVerificationEmail(
    email: string,
    name: string,
    link: string
  ): Promise<void> {
    const taskName = "verify";
    const task = buildTask(taskName, email, { name, link });
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
