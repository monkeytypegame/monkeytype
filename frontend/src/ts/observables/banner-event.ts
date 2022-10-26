type SubscribeFunction = () => void;

const subscribers: SubscribeFunction[] = [];

export function subscribe(fn: SubscribeFunction): void {
  subscribers.push(fn);
}

export function dispatch(): void {
  for (const fn of subscribers) {
    try {
      fn();
    } catch (error) {
      console.error("Banner event subscriber threw an error");
      console.error(error);
    }
  }
}
