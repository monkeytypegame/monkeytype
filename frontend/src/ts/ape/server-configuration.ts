import { Configuration } from "@monkeytype/schemas/configuration";
import Ape from ".";
import { promiseWithResolvers } from "../utils/misc";
import { queryClient } from "../queries";
const staleTime = 1000 * 60 * 60;
const queryKey = ["serverConfiguration"];

const {
  promise: configurationPromise,
  resolve,
  reject,
} = promiseWithResolvers<boolean>();

export { configurationPromise };

export function getServerConfiguration(): Configuration | undefined {
  return get();
}

export function get(): Configuration | undefined {
  return queryClient.getQueryData(queryKey);
}

export async function sync(): Promise<void> {
  try {
    await queryClient.fetchQuery({
      queryFn: fetch,
      queryKey,
      staleTime,
    });
    resolve(true);
  } catch (e) {
    reject(e);
  }
}

async function fetch(): Promise<Configuration> {
  const response = await Ape.configuration.get();

  if (response.status !== 200) {
    const message = `Could not fetch configuration: ${response.body.message}`;
    console.error(message);
    throw new Error(message);
  }
  return response.body.data;
}
