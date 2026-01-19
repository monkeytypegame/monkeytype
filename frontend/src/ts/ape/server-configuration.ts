import { Configuration } from "@monkeytype/schemas/configuration";
import { serverConfiguration } from "../signals/server-configuration";

export const configurationPromise = serverConfiguration.ready();

export function get(): Configuration | undefined {
  return serverConfiguration.state().ready
    ? serverConfiguration.store
    : undefined;
}

export async function sync(): Promise<void> {
  serverConfiguration.refresh();
  return serverConfiguration.ready();
}
