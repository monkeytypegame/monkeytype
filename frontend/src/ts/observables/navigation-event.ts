type NavigationEvent = {
  url: string;
  data?: unknown;
  force?: boolean;
  tribeOverride?: boolean;
};

type SubscribeFunction = (event: NavigationEvent) => void;

const subscribers: SubscribeFunction[] = [];

export function subscribe(fn: SubscribeFunction): void {
  subscribers.push(fn);
}

export function dispatch(event: NavigationEvent): void {
  subscribers.forEach((fn) => {
    try {
      fn(event);
    } catch (e) {
      console.error("Navigation event subscriber threw an error");
      console.error(e);
    }
  });
}
