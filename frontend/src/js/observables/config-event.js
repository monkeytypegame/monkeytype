const subscribers = [];

export function subscribe(fn) {
  subscribers.push(fn);
}

export function dispatch(key, value, value2) {
  subscribers.forEach((fn) => {
    try {
      fn(key, value, value2);
    } catch (e) {
      console.error("Config event subscriber threw an error");
      console.error(e);
    }
  });
}
