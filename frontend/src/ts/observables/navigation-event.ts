import { LoadingOptions } from "../pages/page";

export type NavigateOptions = {
  force?: boolean;
  empty?: boolean;
  //this will be used in tribe
  data?: unknown;
  loadingOptions?: LoadingOptions;
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
      console.error("Navigation event subscriber threw an error");
      console.error(e);
    }
  });
}
