import Ape from ".";

let config: MonkeyTypes.ServerConfiguration | undefined = undefined;

export function get(): MonkeyTypes.ServerConfiguration | undefined {
  return config;
}

export async function sync(): Promise<void> {
  const response = await Ape.configuration.get();

  if (response.status !== 200) {
    console.error("Could not fetch configuration", response.message);
    return;
  } else {
    config = response.data as MonkeyTypes.ServerConfiguration;
  }
}
