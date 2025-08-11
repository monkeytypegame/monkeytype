type EventType =
  | "authStateTrue"
  | "authStateFalse"
  | "authStateChanged"
  | "authUpdated"
  | "snapshotLoaded"
  | "snapshotUpdated";

type SubscribeFunction = (event: EventType) => void;

const subscribers: SubscribeFunction[] = [];

export function subscribe(fn: SubscribeFunction): void {
  subscribers.push(fn);
}

export function dispatch(event: EventType): void {
  subscribers.forEach((fn) => {
    try {
      fn(event);
    } catch (e) {
      console.error("Auth event subscriber threw an error");
      console.error(e);
    }
  });
}
