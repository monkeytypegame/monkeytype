import IORedis from "ioredis";
import {
  type BulkJobOptions,
  type ConnectionOptions,
  type JobsOptions,
  Queue,
  type QueueOptions,
  QueueScheduler,
} from "bullmq";

export class MonkeyQueue<T> {
  private jobQueue: Queue | undefined;
  private _queueScheduler: QueueScheduler;
  public readonly queueName: string;
  private queueOpts: QueueOptions;

  constructor(queueName: string, queueOpts: QueueOptions) {
    this.queueName = queueName;
    this.queueOpts = queueOpts;
  }

  init(redisConnection?: IORedis.Redis): void {
    if (this.jobQueue !== undefined || !redisConnection) {
      return;
    }

    this.jobQueue = new Queue(this.queueName, {
      ...this.queueOpts,
      connection: redisConnection as ConnectionOptions,
    });

    this._queueScheduler = new QueueScheduler(this.queueName, {
      connection: redisConnection as ConnectionOptions,
    });
  }

  async add(taskName: string, task: T, jobOpts?: JobsOptions): Promise<void> {
    if (this.jobQueue === undefined) {
      return;
    }

    await this.jobQueue.add(taskName, task, jobOpts);
  }

  async getJobCounts(): Promise<Record<string, number>> {
    if (this.jobQueue === undefined) {
      return {};
    }

    return await this.jobQueue.getJobCounts();
  }

  async addBulk(
    tasks: { name: string; data: T; opts?: BulkJobOptions }[]
  ): Promise<void> {
    if (this.jobQueue === undefined) {
      return;
    }

    await this.jobQueue.addBulk(tasks);
  }
}
