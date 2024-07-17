import { MongoMemoryReplSet, MongoMemoryServer } from "mongodb-memory-server";
import debugInit from "debug";

const debug = debugInit(`vitest-jest:${process.env.VITEST_WORKER_ID ?? 0}`);

type Options =
  | {
      type?: "default";
      serverOptions?: NonNullable<
        Parameters<typeof MongoMemoryServer["create"]>[0]
      >;
    }
  | {
      type: "replSet";
      serverOptions?: NonNullable<
        Parameters<typeof MongoMemoryReplSet["create"]>[0]
      >;
    };

export async function setup(options?: Options) {
  const type = options?.type ?? "default";
  const serverOptions = options?.serverOptions;

  debug("Starting setup with options:", { type, serverOptions });

  debug("Starting mongo memory server");
  if (type !== "replSet") {
    globalThis.__MONGO_DB__ = await MongoMemoryServer.create(serverOptions);
    globalThis.__MONGO_URI__ = globalThis.__MONGO_DB__.getUri();
  } else {
    globalThis.__MONGO_DB__ = await MongoMemoryReplSet.create(serverOptions);
    globalThis.__MONGO_URI__ = globalThis.__MONGO_DB__.getUri();
  }

  debug("Mongo URI:", globalThis.__MONGO_URI__);
}

export async function teardown() {
  debug("Starting teardown");
  if (globalThis.__MONGO_DB__) {
    debug("Stopping mongo memory server");
    await globalThis.__MONGO_DB__.stop();
  }
}
