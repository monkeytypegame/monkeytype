import IORedis from "ioredis";
import { Queue, QueueOptions, QueueScheduler } from "bullmq";

export class MonkeyQueue<T> {
  jobQueue: Queue;
  _queueScheduler: QueueScheduler;
  queueName: string;
  queueOpts: QueueOptions;

  constructor(queueName: string, queueOpts: QueueOptions) {
    this.queueName = queueName;
    this.queueOpts = queueOpts;
  }

  init(redisConnection?: IORedis.Redis): void {
    if (this.jobQueue || !redisConnection) {
      return;
    }

    this.jobQueue = new Queue(this.queueName, {
      ...this.queueOpts,
      connection: redisConnection,
    });

    this._queueScheduler = new QueueScheduler(this.queueName, {
      connection: redisConnection,
    });
  }

  async add(taskName: string, task: T): Promise<void> {
    if (!this.jobQueue) {
      return;
    }

    await this.jobQueue.add(taskName, task);
  }

  async addBulk(tasks: { name: string; data: T }[]): Promise<void> {
    if (!this.jobQueue) {
      return;
    }

    await this.jobQueue.addBulk(tasks);
  }
}
