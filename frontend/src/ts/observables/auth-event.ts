type AuthEvent =
  | {
      type: "authStateChanged";
      data: { isUserSignedIn: boolean; loadPromise: Promise<void> };
    }
  | { type: "snapshotUpdated"; data: { isInitial: boolean } }
  | { type: "authConfigUpdated"; data?: undefined };

type SubscribeFunction = (event: AuthEvent) => void;

const subscribers: SubscribeFunction[] = [];

export function subscribe(fn: SubscribeFunction): void {
  subscribers.push(fn);
}

export function dispatch(event: AuthEvent): void {
  subscribers.forEach((fn) => {
    try {
      fn(event);
    } catch (e) {
      console.error("Auth event subscriber threw an error");
      console.error(e);
    }
  });
}
