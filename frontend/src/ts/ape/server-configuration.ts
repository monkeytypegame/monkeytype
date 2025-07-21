import { Configuration } from "@monkeytype/schemas/configuration";
import Ape from ".";
import { promiseWithResolvers } from "../utils/misc";

let config: Configuration | undefined = undefined;

const { promise: configPromise, resolve } = promiseWithResolvers<boolean>();

export { configPromise };

export function get(): Configuration | undefined {
  return config;
}

export async function sync(): Promise<void> {
  const response = await Ape.configuration.get();

  if (response.status !== 200) {
    console.error("Could not fetch configuration", response.body.message);
    return;
  } else {
    config = response.body.data ?? undefined;
    resolve(true);
  }
}
