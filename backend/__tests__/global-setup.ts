import * as MongoDbMock from "vitest-mongodb";
import { isIntegrationTest } from "./__integration__";
export async function setup(): Promise<void> {
  process.env.TZ = "UTC";
  if (isIntegrationTest) {
    console.log("integration download mongomock");
    await MongoDbMock.setup(MongoDbMockConfig);
  }
}

export async function teardown(): Promise<void> {
  if (isIntegrationTest) {
    await MongoDbMock.teardown();
  }
}

export const MongoDbMockConfig = {
  serverOptions: {
    binary: {
      version: "6.0.12",
    },
  },
};
