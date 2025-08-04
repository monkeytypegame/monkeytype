import { GenericContainer, StartedTestContainer, Wait } from "testcontainers";
import { isIntegrationTest } from "./__integration__";
import { getConnection } from "../src/init/redis";

let startedMongoContainer: StartedTestContainer | undefined;
let startedRedisContainer: StartedTestContainer | undefined;

export async function setup(): Promise<void> {
  process.env.TZ = "UTC";

  if (isIntegrationTest) {
    //use testcontainer to start mongodb
    //const network = await new Network(new RandomUuid()).start();
    const mongoContainer = new GenericContainer("mongo:5.0.13")
      //.withName("monkeytype-mongo-test")
      .withExposedPorts(27017)
      // .withNetwork(network)
      //.withNetworkMode(network.getName())
      .withWaitStrategy(Wait.forListeningPorts());

    startedMongoContainer = await mongoContainer.start();

    const mongoUrl = `mongodb://${startedMongoContainer?.getHost()}:${startedMongoContainer?.getMappedPort(
      27017
    )}`;
    process.env["TEST_DB_URL"] = mongoUrl;

    //use testcontainer to start redis
    const redisContainer = new GenericContainer("redis:6.2.6")
      .withExposedPorts(6379)
      .withWaitStrategy(Wait.forLogMessage("Ready to accept connections"));

    startedRedisContainer = await redisContainer.start();

    const redisUrl = `redis://${startedRedisContainer.getHost()}:${startedRedisContainer.getMappedPort(
      6379
    )}`;
    process.env["REDIS_URI"] = redisUrl;
  }
}

export async function teardown(): Promise<void> {
  if (isIntegrationTest) {
    await startedMongoContainer?.stop();

    await getConnection()?.quit();
    await startedRedisContainer?.stop();
  }
}
