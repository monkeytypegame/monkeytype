type SubscribeFunction = (wordHeight: number) => void;

const subscribers: SubscribeFunction[] = [];

export function subscribe(fn: SubscribeFunction): void {
  subscribers.push(fn);
}

export function dispatch(wordHeight: number): void {
  subscribers.forEach((fn) => {
    try {
      fn(wordHeight);
    } catch (e) {
      console.error("Line jump event subscriber threw an error");
      console.error(e);
    }
  });
}
