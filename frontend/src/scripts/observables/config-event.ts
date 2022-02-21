type SubscribeFunction<V, V2> = (key: string, value?: V, value2?: V2) => void;

const subscribers: SubscribeFunction<any, any>[] = [];

export function subscribe(fn: SubscribeFunction<any, any>): void {
  subscribers.push(fn);
}

export function dispatch<V, V2>(key: string, value?: V, value2?: V2): void {
  subscribers.forEach((fn) => {
    try {
      fn(key, value, value2);
    } catch (e) {
      console.error("Config event subscriber threw an error");
      console.error(e);
    }
  });
}
