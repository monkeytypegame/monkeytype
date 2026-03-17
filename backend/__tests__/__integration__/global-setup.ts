import { GenericContainer, StartedTestContainer, Wait } from "testcontainers";

let startedMongoContainer: StartedTestContainer | undefined;
let startedRedisContainer: StartedTestContainer | undefined;

export async function setup(): Promise<void> {
  process.env.TZ = "UTC";

  //use testcontainer to start mongodb
  console.log("\x1b[36mMongoDB starting...\x1b[0m");
  const mongoContainer = new GenericContainer("mongo:5.0.13")
    .withExposedPorts(27017)
    .withWaitStrategy(Wait.forListeningPorts());

  startedMongoContainer = await mongoContainer.start();

  const mongoUrl = `mongodb://${startedMongoContainer?.getHost()}:${startedMongoContainer?.getMappedPort(
    27017,
  )}`;
  process.env["TEST_DB_URL"] = mongoUrl;
  console.log(`\x1b[32mMongoDB is running on ${mongoUrl}\x1b[0m`);

  //use testcontainer to start redis
  console.log("\x1b[36mRedis starting...\x1b[0m");
  const redisContainer = new GenericContainer("redis:6.2.6")
    .withExposedPorts(6379)
    .withWaitStrategy(Wait.forLogMessage("Ready to accept connections"));

  startedRedisContainer = await redisContainer.start();

  const redisUrl = `redis://${startedRedisContainer.getHost()}:${startedRedisContainer.getMappedPort(
    6379,
  )}`;
  process.env["REDIS_URI"] = redisUrl;
  console.log(`\x1b[32mRedis is running on ${redisUrl}\x1b[0m`);
}

async function stopContainers(): Promise<void> {
  console.log("\x1b[36mMongoDB stopping...\x1b[0m");
  await startedMongoContainer?.stop();
  console.log("\x1b[36mRedis stopping...\x1b[0m");
  await startedRedisContainer?.stop();
  console.log(`\x1b[32mContainers stopped.\x1b[0m`);
}

export async function teardown(): Promise<void> {
  await stopContainers();
}

process.on("SIGTERM", stopContainers);
process.on("SIGINT", stopContainers);
