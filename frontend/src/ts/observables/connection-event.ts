type SubscribeFunction = (state: boolean) => void;

const subscribers: SubscribeFunction[] = [];

export function subscribe(fn: SubscribeFunction): void {
  subscribers.push(fn);
}

window.addEventListener("load", () => {
  window.addEventListener("online", () => {
    dispatch(true);
  });
  window.addEventListener("offline", () => {
    dispatch(false);
  });
});

function dispatch(state: boolean): void {
  subscribers.forEach((fn) => {
    try {
      fn(state);
    } catch (e) {
      console.error("Connection event subscriber threw an error");
      console.error(e);
    }
  });
}
