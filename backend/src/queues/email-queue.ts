import { MonkeyQueue } from "./monkey-queue";

const QUEUE_NAME = "email-tasks";

export type EmailType = "verify" | "resetPassword";

export type EmailTask<M extends EmailType> = {
  type: M;
  email: string;
  ctx: EmailTaskContexts[M];
};

export type EmailTaskContexts = {
  verify: {
    name: string;
    verificationLink: string;
  };
  resetPassword: {
    name: string;
    passwordResetLink: string;
  };
};

function buildTask(
  taskName: EmailType,
  email: string,
  taskContext: EmailTaskContexts[EmailType]
): EmailTask<EmailType> {
  return {
    type: taskName,
    email: email,
    ctx: taskContext,
  };
}

class EmailQueue extends MonkeyQueue<EmailTask<EmailType>> {
  async sendVerificationEmail(
    email: string,
    name: string,
    verificationLink: string
  ): Promise<void> {
    const taskName = "verify";
    const task = buildTask(taskName, email, { name, verificationLink });
    await this.add(taskName, task);
  }

  async sendForgotPasswordEmail(
    email: string,
    name: string,
    passwordResetLink: string
  ): Promise<void> {
    const taskName = "resetPassword";
    const task = buildTask(taskName, email, { name, passwordResetLink });
    await this.add(taskName, task);
  }
}

export default new EmailQueue(QUEUE_NAME, {
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: true,
    attempts: 1,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
  },
});
