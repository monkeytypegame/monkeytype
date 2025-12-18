export type NotificationOptions = {
  customTitle?: string;
  details?: object | string;
};

export type SubscribeFunction = (
  message: string,
  level: number,
  options: NotificationOptions,
) => void;

const subscribers: SubscribeFunction[] = [];

export function subscribe(fn: SubscribeFunction): void {
  subscribers.push(fn);
}

export function dispatch(
  message: string,
  level: number,
  options: NotificationOptions,
): void {
  subscribers.forEach((fn) => {
    try {
      fn(message, level, options);
    } catch (e) {
      console.error("Notification event subscriber threw an error");
      console.error(e);
    }
  });
}
