import { Configuration } from "@monkeytype/shared-types";
import Ape from ".";

let config: Configuration | undefined = undefined;

export function get(): Configuration | undefined {
  return config;
}

export async function sync(): Promise<void> {
  const response = await Ape.configuration.get();

  if (response.status !== 200) {
    console.error("Could not fetch configuration", response.message);
    return;
  } else {
    config = response.data ?? undefined;
  }
}
