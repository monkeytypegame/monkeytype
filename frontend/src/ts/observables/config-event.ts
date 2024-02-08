type SubscribeFunction = (
  key: string,
  newValue?: SharedTypes.ConfigValue,
  nosave?: boolean,
  previousValue?: SharedTypes.ConfigValue,
  fullConfig?: SharedTypes.Config
) => void;

const subscribers: SubscribeFunction[] = [];

export function subscribe(fn: SubscribeFunction): void {
  subscribers.push(fn);
}

export function dispatch(
  key: string,
  newValue?: SharedTypes.ConfigValue,
  nosave?: boolean,
  previousValue?: SharedTypes.ConfigValue,
  fullConfig?: SharedTypes.Config
): void {
  subscribers.forEach((fn) => {
    try {
      fn(key, newValue, nosave, previousValue, fullConfig);
    } catch (e) {
      console.error("Config event subscriber threw an error");
      console.error(e);
    }
  });
}
