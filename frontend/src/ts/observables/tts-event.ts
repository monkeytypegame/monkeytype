type SubscribeFunction = (text: string) => void;

const subscribers: SubscribeFunction[] = [];

export function subscribe(fn: SubscribeFunction): void {
  subscribers.push(fn);
}

export async function dispatch(text: string): Promise<void> {
  for (const fn of subscribers) {
    try {
      fn(text);
    } catch (error) {
      console.error("TTS event subscriber threw an error");
      console.error(error);
    }
  }
}
