type SubscribeFunction = (text: string) => void;

const subscribers: SubscribeFunction[] = [];

export function subscribe(fn: SubscribeFunction): void {
  subscribers.push(fn);
}

export async function dispatch(text: string): Promise<void> {
  subscribers.forEach((fn) => {
    try {
      fn(text);
    } catch (e) {
      console.error("TTS event subscriber threw an error");
      console.error(e);
    }
  });
}
