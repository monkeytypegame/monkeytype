import { GenericContainer, StartedTestContainer, Wait } from "testcontainers";

let startedMongoContainer: StartedTestContainer | undefined;
let startedRedisContainer: StartedTestContainer | undefined;

export async function setup(): Promise<void> {
  process.env.TZ = "UTC";

  //use testcontainer to start mongodb
  //make sure to update the image version in monkey-ci.yml if you change it here
  const mongoContainer = new GenericContainer("mongo:5.0.13")
    .withExposedPorts(27017)
    .withWaitStrategy(Wait.forListeningPorts());

  startedMongoContainer = await mongoContainer.start();

  const mongoUrl = `mongodb://${startedMongoContainer?.getHost()}:${startedMongoContainer?.getMappedPort(
    27017
  )}`;
  process.env["TEST_DB_URL"] = mongoUrl;

  //use testcontainer to start redis
  //make sure to update the image version in monkey-ci.yml if you change it here
  const redisContainer = new GenericContainer("redis:6.2.6")
    .withExposedPorts(6379)
    .withWaitStrategy(Wait.forLogMessage("Ready to accept connections"));

  startedRedisContainer = await redisContainer.start();

  const redisUrl = `redis://${startedRedisContainer.getHost()}:${startedRedisContainer.getMappedPort(
    6379
  )}`;
  process.env["REDIS_URI"] = redisUrl;
}

export async function teardown(): Promise<void> {
  await startedMongoContainer?.stop();
  await startedRedisContainer?.stop();
}
