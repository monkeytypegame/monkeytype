import { getConnection, connect } from "../../src/init/redis";

export async function redisSetup(): Promise<void> {
  await connect();
}
export async function cleanupKeys(prefix: string): Promise<void> {
  // oxlint-disable-next-line no-non-null-assertion
  const connection = getConnection()!;
  const keys = await connection.keys(`${prefix}*`);
  await Promise.all(keys?.map((it) => connection.del(it)));
}
