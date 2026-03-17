import { Configuration } from "@monkeytype/schemas/configuration";
import { promiseWithResolvers } from "../utils/misc";
import { queryClient } from "../queries";
import { getServerConfigurationQueryOptions } from "../queries/server-configuration";

const {
  promise: configurationPromise,
  resolve,
  reject,
} = promiseWithResolvers<boolean>();

export { configurationPromise };

export function get(): Configuration | undefined {
  return queryClient.getQueryData(
    getServerConfigurationQueryOptions().queryKey,
  );
}

export async function sync(): Promise<void> {
  try {
    await queryClient.fetchQuery(getServerConfigurationQueryOptions());
    resolve(true);
  } catch (e) {
    reject(e);
  }
}
