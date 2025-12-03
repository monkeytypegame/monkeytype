type NavigateOptions = {
  force?: boolean;
  tribeOverride?: boolean;
};

type SubscribeFunction = (url: string, options?: NavigateOptions) => void;

const subscribers: SubscribeFunction[] = [];

export function subscribe(fn: SubscribeFunction): void {
  subscribers.push(fn);
}

export function dispatch(url: string, options?: NavigateOptions): void {
  subscribers.forEach((fn) => {
    try {
      fn(url, options);
    } catch (e) {
      console.error("Navigate event subscriber threw an error");
      console.error(e);
    }
  });
}
