type SubscribeFunction = (
  message: string,
  level: number,
  customTitle?: string
) => void;

const subscribers: SubscribeFunction[] = [];

export function subscribe(fn: SubscribeFunction): void {
  subscribers.push(fn);
}

export function dispatch(
  message: string,
  level: number,
  customTitle?: string
): void {
  subscribers.forEach((fn) => {
    try {
      fn(message, level, customTitle);
    } catch (e) {
      console.error("Notification event subscriber threw an error");
      console.error(e);
    }
  });
}
