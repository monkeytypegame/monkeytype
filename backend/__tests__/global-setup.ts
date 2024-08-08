import * as MongoDbMock from "vitest-mongodb";
export async function setup(): Promise<void> {
  process.env.TZ = "UTC";
  await MongoDbMock.setup({
    serverOptions: {
      binary: {
        version: "6.0.12",
      },
    },
  });
}

export async function teardown(): Promise<void> {
  await MongoDbMock.teardown();
}
