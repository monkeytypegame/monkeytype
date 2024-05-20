import * as MongoDbMock from "vitest-mongodb";
export async function setup({ provide }): Promise<void> {
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
