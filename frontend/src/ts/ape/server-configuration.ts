import Ape from ".";
import * as SharedMonkeyTypes from "@backend/types/shared";

let config: SharedMonkeyTypes.Configuration | undefined = undefined;

export function get(): SharedMonkeyTypes.Configuration | undefined {
  return config;
}

export async function sync(): Promise<void> {
  const response = await Ape.configuration.get();

  if (response.status !== 200) {
    console.error("Could not fetch configuration", response.message);
    return;
  } else {
    config = response.data as SharedMonkeyTypes.Configuration;
  }
}
