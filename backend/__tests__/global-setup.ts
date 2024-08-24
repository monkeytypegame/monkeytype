import * as MongoDbMock from "vitest-mongodb";
export async function setup(): Promise<void> {
  process.env.TZ = "UTC";
  await MongoDbMock.setup(MongoDbMockConfig);
}

export async function teardown(): Promise<void> {
  await MongoDbMock.teardown();
}

export const MongoDbMockConfig = {
  serverOptions: {
    binary: {
      version: "6.0.12",
    },
  },
};
