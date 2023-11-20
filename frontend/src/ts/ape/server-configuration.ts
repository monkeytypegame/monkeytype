import Ape from ".";

let config: MonkeyTypes.Configuration | undefined = undefined;

export function get(): MonkeyTypes.Configuration | undefined {
  return config;
}

export async function sync(): Promise<void> {
  const response = await Ape.configuration.get();

  if (response.status !== 200) {
    console.error("Could not fetch configuration", response.message);
    return;
  } else {
    config = response.data as MonkeyTypes.Configuration;
  }
}
