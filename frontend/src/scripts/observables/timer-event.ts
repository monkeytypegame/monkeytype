type SubscribeFunction = (key: string, value?: string, value2?: string) => void;

const subscribers: SubscribeFunction[] = [];

export function subscribe(fn: SubscribeFunction): void {
  subscribers.push(fn);
}

export function dispatch(key: string, value?: string, value2?: string): void {
  subscribers.forEach((fn) => {
    try {
      fn(key, value, value2);
    } catch (e) {
      console.error("Timer event subscriber threw an error");
      console.error(e);
    }
  });
}
