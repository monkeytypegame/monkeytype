import { GenericContainer, StartedTestContainer, Wait } from "testcontainers";
import { isIntegrationTest } from "./__integration__";

let startedMongoContainer: StartedTestContainer | undefined;

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
  }
}

export async function teardown(): Promise<void> {
  if (isIntegrationTest) {
    await startedMongoContainer?.stop();
  }
}
